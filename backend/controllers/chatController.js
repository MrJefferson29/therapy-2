const Chat = require('../models/chat');

// Get chat history for a room
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Chat.find({ roomId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Save a new chat message
exports.saveMessage = async (req, res) => {
  try {
    const { roomId, sender, receiver, message } = req.body;
    const chat = new Chat({ roomId, sender, receiver, message });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all unique users who have chatted with a therapist
exports.getTherapistChats = async (req, res) => {
  try {
    const { therapistId } = req.params;
    // Find all chats where the therapist is the receiver
    const chats = await Chat.find({ receiver: therapistId }).populate('sender', 'username email profileImage');
    // Get unique users
    const userMap = {};
    chats.forEach(chat => {
      if (chat.sender && chat.sender._id) {
        userMap[chat.sender._id] = {
          userId: chat.sender._id,
          username: chat.sender.username,
          email: chat.sender.email,
          profileImage: chat.sender.profileImage,
        };
      }
    });
    res.status(200).json(Object.values(userMap));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 