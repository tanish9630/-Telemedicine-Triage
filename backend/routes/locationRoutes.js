import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/location/nearest-doctors
// Body: { lat, lng, radius (km, default 50), limit (default 10) }
router.post('/nearest-doctors', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 50, limit = 10 } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const patientLat = parseFloat(lat);
    const patientLng = parseFloat(lng);

    // Fetch all doctors that have a saved location
    const doctors = await User.find({
      role: 'doctor',
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
    }).select('-password');

    // Compute distance for each doctor and filter by radius
    const withDistance = doctors
      .map((doc) => {
        const distanceKm = haversineKm(
          patientLat,
          patientLng,
          doc.location.lat,
          doc.location.lng
        );
        return { ...doc.toObject(), distanceKm: parseFloat(distanceKm.toFixed(1)) };
      })
      .filter((doc) => doc.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    res.json(withDistance);
  } catch (err) {
    console.error('Nearest doctors error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
