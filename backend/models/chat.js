const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['message', 'appointment_notification', 'appointment_approved', 'appointment_declined'], default: 'message' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
});

module.exports = mongoose.model('Chat', chatSchema); 