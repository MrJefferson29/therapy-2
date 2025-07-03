const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date, // Set by admin
  zoomLink: String, // Set by admin
  notes: String,
});

module.exports = mongoose.model('Appointment', appointmentSchema); 