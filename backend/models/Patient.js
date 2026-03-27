import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  medicalHistory: [{
    condition: String,
    diagnosedYear: Number,
  }],
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
