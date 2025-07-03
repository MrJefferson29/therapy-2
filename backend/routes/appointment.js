const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  requestAppointment,
  getUserAppointments,
  getTherapistAppointments,
  approveAppointment,
  declineAppointment,
  cancelAppointment,
  getAppointment
} = require('../controllers/appointment');

// Request an appointment (client)
router.post('/request', verifyToken, requestAppointment);

// Get user's appointments (both as client and therapist)
router.get('/my', verifyToken, getUserAppointments);

// Get therapist's appointments (pending requests)
router.get('/therapist', verifyToken, getTherapistAppointments);

// Get single appointment details
router.get('/:appointmentId', verifyToken, getAppointment);

// Approve appointment (therapist)
router.put('/:appointmentId/approve', verifyToken, approveAppointment);

// Decline appointment (therapist)
router.put('/:appointmentId/decline', verifyToken, declineAppointment);

// Cancel appointment (client or therapist)
router.put('/:appointmentId/cancel', verifyToken, cancelAppointment);

module.exports = router; 