const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  email: { type: String },
  // Add more fields as needed
});

module.exports = mongoose.model('Therapist', therapistSchema); 