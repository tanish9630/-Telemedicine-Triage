import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Emergency from '../models/Emergency.js';
import User from '../models/User.js';
import { getIo } from '../utils/socket.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const doctors = await User.find({ role: 'doctor' }); // Fetch all doctors
    
    let nearestDoctor = null;
    let minDistance = Infinity;

    // Basic Euclidean distance for simplicity. Real apps might use Haversine or GeoJSON 2dsphere indexing.
    if (lat && lng) {
      doctors.forEach(doc => {
        if (doc.location && doc.location.lat && doc.location.lng) {
          const dLat = doc.location.lat - lat;
          const dLng = doc.location.lng - lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng); // Pythagorean distance
          if (dist < minDistance) {
            minDistance = dist;
            nearestDoctor = doc;
          }
        }
      });
    }

    // fallback to first doctor if none found with loc
    if (!nearestDoctor && doctors.length > 0) {
      nearestDoctor = doctors[0];
    }

    const newEmergency = await Emergency.create({
      patient: req.user._id,
      location: { lat: lat || 0, lng: lng || 0 },
      assignedDoctor: nearestDoctor ? nearestDoctor._id : null
    });

    await newEmergency.populate('patient', 'fullName email');
    if (nearestDoctor) {
      await newEmergency.populate('assignedDoctor', 'fullName location');
    }

    const io = getIo();
    io.to('doctors').emit('critical_sos_alert', {
      emergency: newEmergency,
      nearestDoctorId: nearestDoctor ? nearestDoctor._id : null,
      message: `Emergency SOS triggered by ${newEmergency.patient.fullName}!`,
    });

    res.status(201).json({ success: true, emergency: newEmergency });
  } catch (error) {
    console.error('Emergency Route Error:', error);
    res.status(500).json({ message: 'Server Error in Emergency route' });
  }
});

export default router;
