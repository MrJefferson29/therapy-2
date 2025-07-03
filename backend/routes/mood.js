const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const { verifyToken } = require('../middleware/auth');

// Create mood
router.post('/', verifyToken, moodController.createMood);
// Get all moods
router.get('/', moodController.getAllMoods);
// Get mood by ID
router.get('/:id', moodController.getMoodById);
// Get moods by author
router.get('/author/:authorId', moodController.getMoodsByAuthor);
// Update mood
router.put('/:id', verifyToken, moodController.updateMood);
// Delete mood
router.delete('/:id', verifyToken, moodController.deleteMood);

module.exports = router; 