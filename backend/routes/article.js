const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const multer = require('multer');
const { articleStorage } = require('../config/cloudinary');

const upload = multer({ storage: articleStorage });

// Create article (with file upload)
router.post('/', upload.array('files', 10), articleController.createArticle);
// Get all articles
router.get('/', articleController.getAllArticles);
// Get article by ID
router.get('/:id', articleController.getArticleById);
// Update article (with file upload)
router.put('/:id', upload.array('files', 10), articleController.updateArticle);
// Delete article
router.delete('/:id', articleController.deleteArticle);
// Like an article
router.post('/:id/like', articleController.likeArticle);
// Increment view count
router.post('/:id/view', articleController.incrementView);

module.exports = router; 