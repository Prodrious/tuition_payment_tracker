// // server/models.js
// const mongoose = require('mongoose');

// const StudentSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   subject: { type: String, required: true },
//   rate: { type: Number, required: true },
//   type: { type: String, enum: ['UPFRONT', 'POSTPAID'], required: true },
//   initialBalance: { type: Number, default: 0 },
//   balance: { type: Number, default: 0 }, // Tracks current money
//   isArchived: { type: Boolean, default: false }, // For soft delete
//   createdAt: { type: Date, default: Date.now }
// });

// const ClassSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
//   date: { type: String, required: true }, // Format: YYYY-MM-DD
//   time: { type: String, required: true },
//   status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
//   createdAt: { type: Date, default: Date.now }
// });

// const Student = mongoose.model('Student', StudentSchema);
// const Class = mongoose.model('Class', ClassSchema);

// module.exports = { Student, Class };




// server/models.js
const mongoose = require('mongoose');

/* =====================
   STUDENT SCHEMA
===================== */
const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['UPFRONT', 'POSTPAID'],
    required: true
  },
  initialBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/* =====================
   CLASS / SCHEDULE SCHEMA
===================== */
const ClassSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // Start time (HH:mm)
    required: true
  },
  endTime: {
    type: String, // End time (HH:mm)
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 0.25 // supports 15 / 30 / 45 min if needed
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


/* =====================
   MODELS
===================== */
const Student = mongoose.model('Student', StudentSchema);
const Class = mongoose.model('Class', ClassSchema);

module.exports = { Student, Class };
