const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const User = require('../models/user');

console.log('verifyToken middleware running');

exports.verifyToken = async (req, res, next) => {
  try {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(403).json({ message: 'User not found' });
    
    req.user = user;
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

exports.requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
