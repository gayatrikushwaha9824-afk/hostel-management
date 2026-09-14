const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roomNumber: { type: String, required: true },
  phone: { type: String, required: true },
  semester: { type: String, required: true },
  course: { type: String, required: true },
  rentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);