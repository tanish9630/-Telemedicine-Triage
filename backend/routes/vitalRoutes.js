import express from 'express';
import Vital from '../models/Vital.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/vitals
// @desc    Create or update a vital log for today
// @access  Private (Patient)
router.post('/', protect, async (req, res) => {
  try {
    const { heartRate, sleep, sugar, temp } = req.body;
    
    // Use the current date as an identifier (e.g. '2023-10-25')
    const now = new Date();
    const dateLog = now.toISOString().split('T')[0];
    
    // Also store the short day name for charting (e.g. 'Mon', 'Tue')
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now);

    // See if the patient already logged today
    let vital = await Vital.findOne({ patient: req.user._id, dateLog });

    if (vital) {
      // Update existing today's log
      vital.heartRate = heartRate || vital.heartRate;
      vital.sleep = sleep || vital.sleep;
      vital.sugar = sugar || vital.sugar;
      vital.temp = temp || vital.temp;
      const updatedVital = await vital.save();
      return res.json(updatedVital);
    } else {
      // Create new daily log
      vital = new Vital({
        patient: req.user._id,
        dateLog,
        day: dayName,
        heartRate: heartRate || 0,
        sleep: sleep || 0,
        sugar: sugar || 0,
        temp: temp || 0,
      });
      const createdVital = await vital.save();
      return res.status(201).json(createdVital);
    }
  } catch (error) {
    console.error('Error logging vitals:', error);
    res.status(500).json({ message: 'Server error logging vitals' });
  }
});

// @route   GET /api/vitals/my
// @desc    Get logged in patient's past vitals (limit to 7)
// @access  Private (Patient)
router.get('/my', protect, async (req, res) => {
  try {
    // Sort by dateLog descending so we get most recent, limit to 7 days, then reverse for chronological charting
    const vitals = await Vital.find({ patient: req.user._id })
      .sort({ dateLog: -1 })
      .limit(7);
      
    res.json(vitals.reverse());
  } catch (error) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({ message: 'Server error fetching vitals' });
  }
});

export default router;
