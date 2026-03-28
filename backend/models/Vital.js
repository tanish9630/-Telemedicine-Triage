import mongoose from 'mongoose';

const vitalSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    dateLog: {
      type: String,
      required: true, 
      // e.g. '2023-10-25' to track one entry per day
    },
    day: {
      type: String,
      required: true,
      // e.g. 'Mon', 'Tue'
    },
    heartRate: {
      type: Number,
      required: true,
      default: 0,
    },
    sleep: {
      type: Number,
      required: true,
      default: 0,
    },
    sugar: {
      type: Number,
      required: true,
      default: 0,
    },
    temp: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Vital = mongoose.model('Vital', vitalSchema);

export default Vital;
