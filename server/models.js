// server/models.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  rate: { type: Number, required: true },
  type: { type: String, enum: ['UPFRONT', 'POSTPAID'], required: true },
  initialBalance: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }, // Tracks current money
  isArchived: { type: Boolean, default: false }, // For soft delete
  createdAt: { type: Date, default: Date.now }
});

const ClassSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', StudentSchema);
const Class = mongoose.model('Class', ClassSchema);

module.exports = { Student, Class };