import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const router = express.Router();

// Helper: generate Agora channel name
const makeChannel = () => 'room-' + Math.random().toString(36).slice(2, 10);

// GET /api/appointments/doctors — list all registered doctors
router.get('/doctors', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/appointments — patient books an appointment
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, dateTime, reason } = req.body;
    const appt = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      dateTime,
      reason,
    });
    const populated = await appt.populate([
      { path: 'patient', select: 'fullName email' },
      { path: 'doctor', select: 'fullName specialization' },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/appointments/my — patient fetches their appointments
router.get('/my', protect, async (req, res) => {
  try {
    const appts = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'fullName specialization email')
      .sort({ dateTime: 1 });
    res.json(appts);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/appointments/doctor — doctor fetches their requests
router.get('/doctor', protect, async (req, res) => {
  try {
    const appts = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'fullName email')
      .sort({ dateTime: 1 });
    res.json(appts);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH /api/appointments/:id/status — doctor approves / rejects
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appt.doctor) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorised' });

    appt.status = status;
    if (status === 'approved' && !appt.channelName) {
      appt.channelName = makeChannel();
    }
    await appt.save();
    const populated = await appt.populate([
      { path: 'patient', select: 'fullName email' },
      { path: 'doctor', select: 'fullName specialization' },
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/appointments/:id — delete appointment
router.delete('/:id', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    
    // Only the assigned doctor (or patient) should be able to delete it
    if (String(appt.doctor) !== String(req.user._id) && String(appt.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorised to delete this appointment' });
    }

    await appt.deleteOne();
    res.json({ message: 'Appointment removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/appointments/analytics — doctor dashboard metrics
router.get('/analytics', protect, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const [total, todayCount, pending, approved] = await Promise.all([
      Appointment.countDocuments({ doctor: doctorId }),
      Appointment.countDocuments({ doctor: doctorId, dateTime: { $gte: startOfToday, $lt: endOfToday } }),
      Appointment.countDocuments({ doctor: doctorId, status: 'pending' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'approved' }),
    ]);

    // Age‑group breakdown from patient profiles (approximate from appointment data)
    const patientIds = await Appointment.distinct('patient', { doctor: doctorId });
    const patients = await User.find({ _id: { $in: patientIds } }).select('fullName email');

    // Today's approved appointments for schedule list
    const todayAppts = await Appointment.find({
      doctor: doctorId,
      status: 'approved',
      dateTime: { $gte: startOfToday, $lt: endOfToday },
    }).populate('patient', 'fullName email');

    res.json({
      totalCounseling: approved,
      overallBooking: total,
      newAppointments: pending,
      todaySchedule: todayCount,
      todayAppts,
      patients,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
