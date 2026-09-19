const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    semester: { type: String, default: '' },
    course: { type: String, default: '' },
    rentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    rentAmount: { type: Number, default: 5000 },
    idProofUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);