const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const Therapist = require('../models/therapist');
const User = require('../models/user');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// User: Book appointment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { therapistId, notes } = req.body;
    const appointment = new Appointment({
      user: req.userId,
      therapist: therapistId,
      notes,
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ message: 'Error booking appointment' });
  }
});

// User: Get my appointments
router.get('/my', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.userId }).populate('therapist');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all pending appointments
router.get('/requests', verifyToken, requireAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'pending' }).populate('user therapist');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Approve appointment
router.put('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { date, zoomLink } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date(), admin: req.userId, date, zoomLink },
      { new: true }
    ).populate('user therapist');
    // Send email to user
    await sendEmail({
      to: appointment.user.email,
      subject: 'Your Therapy Session is Approved',
      text: `Your session with ${appointment.therapist.name} is approved for ${date}. Zoom: ${zoomLink}`
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: 'Error approving appointment' });
  }
});

// Admin: Decline appointment
router.put('/:id/decline', verifyToken, requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'declined', admin: req.userId },
      { new: true }
    );
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: 'Error declining appointment' });
  }
});

module.exports = router; 