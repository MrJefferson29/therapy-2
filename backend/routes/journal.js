const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create a new journal entry
router.post('/', journalController.createJournal);

// Get all journal entries for the authenticated user
router.get('/', journalController.getAllJournals);

// Get journal entry by ID
router.get('/:id', journalController.getJournalById);

// Get journal entries by author (for the authenticated user)
router.get('/author/:authorId', journalController.getJournalsByAuthor);

// Update journal entry
router.put('/:id', journalController.updateJournal);

// Delete journal entry
router.delete('/:id', journalController.deleteJournal);

// Toggle favorite status
router.patch('/:id/favorite', journalController.toggleFavorite);

module.exports = router; 