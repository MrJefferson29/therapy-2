const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Ai = require("../models/ai");
const Session = require("../models/session");
const intents = require('../intents.json'); // adjust path as needed

// Initialize the AI model
const genAI = new GoogleGenerativeAI("AIzaSyAn0cFp4NCF9MGzRXT_hJUk62lycLdyrBY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()\[\]{}"']/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

function matchIntent(userInput) {
  const normalizedInput = normalize(userInput);
  for (const intent of intents.intents) {
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      // Use regex to match pattern as a phrase or as individual words
      // Try full phrase match first
      const phraseRegex = new RegExp(`\\b${normalizedPattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (phraseRegex.test(normalizedInput)) {
        const responses = intent.resonses || intent.responses;
        if (responses && responses.length > 0) {
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
      // If not, try matching all words in the pattern
      const words = normalizedPattern.split(' ');
      if (words.every(word => normalizedInput.includes(word))) {
        const responses = intent.resonses || intent.responses;
        if (responses && responses.length > 0) {
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
  }
  return null;
}

const startSession = async (req, res) => {
  try {
    const { mood } = req.body;
    if (typeof mood !== 'number' || mood < 1 || mood > 10) {
      return res.status(400).json({ error: 'Mood (1-10) is required to start a session.' });
    }
    const newSession = new Session({ user: req.userId, mood });
    await newSession.save();
    res.json({ sessionId: newSession._id });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
};

const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findOne({ _id: sessionId, user: req.userId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    session.terminated = true;
    await session.save();
    res.json({ message: "Session terminated" });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
};

const generateContent = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    let { sessionId } = req.body;

    // If no sessionId, create a new session for the user
    if (!sessionId) {
      const newSession = new Session({ user: req.userId });
      await newSession.save();
      sessionId = newSession._id;
    }

    // Check if session is terminated
    const session = await Session.findOne({ _id: sessionId, user: req.userId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.terminated) return res.status(400).json({ error: "Session is terminated" });

    // Fetch all previous messages for this session, ordered by creation time
    const previousMessages = await Ai.find({ session: sessionId }).sort({ createdAt: 1 });

    // Build the conversation history as a prompt
    let historyPrompt = '';
    previousMessages.forEach(msg => {
      historyPrompt += `User: ${msg.prompt}\nAI: ${msg.response}\n`;
    });
    // Add the new user message
    historyPrompt += `User: ${prompt}\nAI:`;

    const matchedResponse = matchIntent(prompt);
    if (matchedResponse) {
      // Save to DB as usual if you want
      const newAiEntry = new Ai({
        prompt: prompt,
        response: matchedResponse,
        session: sessionId,
      });
      await newAiEntry.save();
      return res.json({ text: matchedResponse, sessionId });
    }

    // Generate the AI response using the full conversation history
    const result = await model.generateContent(historyPrompt);
    const generatedText = await result.response.text();

    if (generatedText) {
      const newAiEntry = new Ai({
        prompt: prompt,
        response: generatedText,
        session: sessionId,
      });

      await newAiEntry.save();
      // Return the generated text and sessionId
      res.json({ text: generatedText, sessionId });
    } else {
      res.status(500).json({ error: "AI response is empty" });
    }
  } catch (error) {
    console.error("Error generating AI content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
};

const selfCareHomeContent = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `
You are a wellness and self-care assistant for a mobile app. For the date ${today}, generate a JSON object with the following fields:

- quote: A short, original, motivational quote for the day (max 120 chars).
- focus: An object with:
    - tip: A single actionable self-care tip for today (1-2 sentences).
    - duration: The recommended time in seconds to spend on this focus (e.g. 300 for 5 minutes, 60 for 1 minute, etc.)
- article: An object with:
    - title: A catchy, positive article title (max 10 words)
    - summary: A 1-2 sentence summary of the article
    - icon: An appropriate Ionicons or MaterialCommunityIcons icon name (e.g. 'leaf-outline', 'book-outline', 'meditation', 'cloud-outline', etc.)
    - body: A 3-5 paragraph article body with practical advice and encouragement
    - links: An array of up to 3 relevant, reputable external links (with title and url)
    - related: An array of up to 3 related article titles (strings only)

Return ONLY the JSON object, no extra text or explanation.`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    // Try to parse the JSON from the AI response
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from the response if extra text is present
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        throw new Error('AI did not return valid JSON');
      }
    }
    // Fallback: if focus is a string, convert to object
    if (typeof data.focus === 'string') {
      data.focus = { tip: data.focus, duration: 300 };
    }
    // Fallback: if duration missing, set to 300 seconds (5 min)
    if (!data.focus.duration) {
      data.focus.duration = 300;
    }
    res.json(data);
  } catch (error) {
    console.error('Error generating self-care home content:', error);
    res.status(500).json({ error: 'Failed to generate self-care home content' });
  }
};

module.exports = { generateContent, startSession, endSession, selfCareHomeContent };