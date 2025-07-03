const User = require('../models/user');
const Journal = require('../models/journal');

// GET /users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email createdAt profileImage'); // omit password
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /users/:id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, 'username email createdAt profileImage');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /users/me
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'username email createdAt profileImage role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Get all journals authored by this user
    const journals = await Journal.find({ author: req.userId }, 'title mood note createdAt').sort({ createdAt: -1 });
    const journalCount = journals.length;
    res.status(200).json({
      ...user.toObject(),
      journalCount,
      journals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /users/me
exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['username', 'email', 'profileImage'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, fields: 'username email createdAt profileImage' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /users/therapists
exports.getAllTherapists = async (req, res) => {
  try {
    const therapists = await User.find({ role: 'therapist' }, 'username email createdAt profileImage'); // omit password
    res.status(200).json(therapists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
