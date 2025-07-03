const express = require('express');
const router = express.Router();
const Therapist = require('../models/therapist');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get all therapists (public)
router.get('/', async (req, res) => {
  try {
    const therapists = await Therapist.find();
    res.json(therapists);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create therapist (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const therapist = new Therapist(req.body);
    await therapist.save();
    res.status(201).json(therapist);
  } catch (err) {
    res.status(400).json({ message: 'Error creating therapist' });
  }
});

// Update therapist (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const therapist = await Therapist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(therapist);
  } catch (err) {
    res.status(400).json({ message: 'Error updating therapist' });
  }
});

// Delete therapist (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Therapist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Therapist deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting therapist' });
  }
});

module.exports = router; 