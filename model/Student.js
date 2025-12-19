const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    rate: { type: Number, required: true },
    balance: { type: Number, default: 0 },
    initialBalance: { type: Number, default: 0 },
    type: { type: String, enum: ['UPFRONT', 'POSTPAID'], required: true },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', StudentSchema);
