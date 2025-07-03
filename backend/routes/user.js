const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateProfile,
  getAllTherapists,
} = require('../controllers/user');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const User = require('../models/user');

// Private: Fetch logged‑in user's own profile
router.get('/me', verifyToken, getMyProfile);

// Public: Fetch all users
router.get('/', getAllUsers);

// Public: Fetch all therapists
router.get('/therapists', getAllTherapists);

// Public: Fetch any user by ID
router.get('/:id', getUserById);

// PATCH /user/me (update profile)
router.put('/me', verifyToken, updateProfile);

// POST /user/me/upload-profile-image
router.post('/me/upload-profile-image', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file.path;
    // Set as user's profileImage
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: imageUrl },
      { new: true, fields: 'username email createdAt profileImage' }
    );
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

module.exports = router;
