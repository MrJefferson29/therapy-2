console.log('Loaded appointment.js controller');

const Appointment = require('../models/appointment');
const User = require('../models/user');
const Chat = require('../models/chat');

// Request an appointment (client)
const requestAppointment = async (req, res) => {
  try {
    const { title, description, scheduledTime, therapistId } = req.body;
    const clientId = req.user._id;

    // Validate required fields
    if (!title || !description || !scheduledTime || !therapistId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if therapist exists and is actually a therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    // Check if client is not trying to book with themselves
    if (clientId.toString() === therapistId) {
      return res.status(400).json({ error: 'Cannot book appointment with yourself' });
    }

    // Check if there's already a pending appointment between these users
    const existingAppointment = await Appointment.findOne({
      client: clientId,
      therapist: therapistId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'You already have a pending or approved appointment with this therapist' });
    }

    const appointment = new Appointment({
      title,
      description,
      scheduledTime: new Date(scheduledTime),
      therapist: therapistId,
      client: clientId,
      status: 'pending'
    });

    await appointment.save();

    // Populate therapist and client details for response
    await appointment.populate('therapist', 'username email profileImage');
    await appointment.populate('client', 'username email profileImage');

    // Create a chat message notification
    const roomId = [clientId, therapistId].sort().join('_');
    const notificationMessage = `Appointment request: ${title}`;
    const chatMessage = new Chat({
      roomId,
      sender: clientId,
      receiver: therapistId,
      message: notificationMessage,
      type: 'appointment_notification',
      appointmentId: appointment._id
    });
    await chatMessage.save();

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error requesting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get appointments for a user (both as client and therapist)
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    let query = {
      $or: [
        { client: userId },
        { therapist: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('therapist', 'username email profileImage')
      .populate('client', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get appointments for a therapist (pending requests)
const getTherapistAppointments = async (req, res) => {
  try {
    const therapistId = req.user._id;

    // Verify user is a therapist
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Only therapists can access this endpoint' });
    }

    const appointments = await Appointment.find({ 
      therapist: therapistId,
      status: { $in: ['pending', 'approved'] }
    })
      .populate('client', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error getting therapist appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve appointment (therapist)
const approveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { meetingLink, notes } = req.body;
    const therapistId = req.user._id;

    // Debug logging
    console.log('DEBUG approveAppointment:');
    console.log('req.user:', req.user);
    console.log('req.user._id:', req.user._id);
    console.log('req.user.role:', req.user.role);
    console.log('req.body:', req.body);
    const appointment = await Appointment.findById(appointmentId);
    console.log('appointment.therapist:', appointment && appointment.therapist);

    // Verify user is a therapist
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Only therapists can approve appointments' });
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify the therapist owns this appointment
    if (appointment.therapist.toString() !== therapistId.toString()) {
      return res.status(403).json({ error: 'Not authorized to approve this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Appointment is not in pending status' });
    }

    appointment.status = 'approved';
    appointment.meetingLink = meetingLink;
    appointment.notes = notes;
    appointment.approvedAt = new Date();

    await appointment.save();

    // Populate details for response
    await appointment.populate('therapist', 'username email profileImage');
    await appointment.populate('client', 'username email profileImage');

    // Create a chat message notification for approval
    const roomId = [appointment.client._id, appointment.therapist._id].sort().join('_');
    const notificationMessage = `Appointment approved! Meeting link: ${meetingLink}`;
    const chatMessage = new Chat({
      roomId,
      sender: appointment.therapist._id,
      receiver: appointment.client._id,
      message: notificationMessage,
      type: 'appointment_approved',
      appointmentId: appointment._id
    });
    await chatMessage.save();

    res.json(appointment);
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Decline appointment (therapist)
const declineAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    const therapistId = req.user._id;

    // Verify user is a therapist
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Only therapists can decline appointments' });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify the therapist owns this appointment
    if (appointment.therapist.toString() !== therapistId.toString()) {
      return res.status(403).json({ error: 'Not authorized to decline this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Appointment is not in pending status' });
    }

    appointment.status = 'declined';
    appointment.notes = notes;
    appointment.declinedAt = new Date();

    await appointment.save();

    // Populate details for response
    await appointment.populate('therapist', 'username email profileImage');
    await appointment.populate('client', 'username email profileImage');

    // Create a chat message notification for decline
    const roomId = [appointment.client._id, appointment.therapist._id].sort().join('_');
    const notificationMessage = `Appointment declined${notes ? `: ${notes}` : ''}`;
    const chatMessage = new Chat({
      roomId,
      sender: appointment.therapist._id,
      receiver: appointment.client._id,
      message: notificationMessage,
      type: 'appointment_declined',
      appointmentId: appointment._id
    });
    await chatMessage.save();

    res.json(appointment);
  } catch (error) {
    console.error('Error declining appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel appointment (client or therapist)
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify the user is either the client or therapist
    if (appointment.client.toString() !== userId.toString() && 
        appointment.therapist.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved appointments can be cancelled' });
    }

    appointment.status = 'cancelled';

    await appointment.save();

    // Populate details for response
    await appointment.populate('therapist', 'username email profileImage');
    await appointment.populate('client', 'username email profileImage');

    res.json(appointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single appointment details
const getAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('therapist', 'username email profileImage')
      .populate('client', 'username email profileImage');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify the user is either the client or therapist
    if (appointment.client._id.toString() !== userId.toString() && 
        appointment.therapist._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  requestAppointment,
  getUserAppointments,
  getTherapistAppointments,
  approveAppointment,
  declineAppointment,
  cancelAppointment,
  getAppointment
}; 