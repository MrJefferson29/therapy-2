const Article = require('../models/articles');

// Create a new article
exports.createArticle = async (req, res) => {
  try {
    let files = [];
    if (req.files && req.files.length > 0) {
      files = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('image') ? 'image' : 'video',
      }));
    }
    const article = new Article({
      ...req.body,
      files,
    });
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message, body: req.body, files: req.files });
  }
};

// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update article
exports.updateArticle = async (req, res) => {
  try {
    let update = { ...req.body };
    if (req.files && req.files.length > 0) {
      update.files = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('image') ? 'image' : 'video',
      }));
    }
    const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Like an article
exports.likeArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ likes: article.likes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Increment view count
exports.incrementView = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ views: article.views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 