const Mood = require('../models/mood');
const User = require('../models/user');

// Create a new mood
exports.createMood = async (req, res) => {
  try {
    const { mood } = req.body;
    if (!mood) return res.status(400).json({ error: 'Mood is required' });
    const newMood = new Mood({
      author: req.userId,
      mood,
    });
    await newMood.save();
    res.status(201).json(newMood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all moods
exports.getAllMoods = async (req, res) => {
  try {
    const moods = await Mood.find().populate('author', 'username email');
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get mood by ID
exports.getMoodById = async (req, res) => {
  try {
    const mood = await Mood.findById(req.params.id).populate('author', 'username email');
    if (!mood) return res.status(404).json({ error: 'Mood not found' });
    res.json(mood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get moods by author
exports.getMoodsByAuthor = async (req, res) => {
  try {
    const authorId = req.params.authorId;
    const moods = await Mood.find({ author: authorId }).populate('author', 'username email');
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update mood
exports.updateMood = async (req, res) => {
  try {
    const { mood } = req.body;
    const updated = await Mood.findByIdAndUpdate(
      req.params.id,
      { mood },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Mood not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete mood
exports.deleteMood = async (req, res) => {
  try {
    const deleted = await Mood.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Mood not found' });
    res.json({ message: 'Mood deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 