import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    rate: { type: Number, required: true },
    balance: { type: Number, default: 0 },
    initialBalance: { type: Number, default: 0 },
    type: { type: String, enum: ['UPFRONT', 'POSTPAID'], required: true },
    isArchived: { type: Boolean, default: false },
    payments: {amount: { type: Number, required: true }},
  },
  { timestamps: true }
);

export default mongoose.models.Student ||
  mongoose.model('Student', StudentSchema);

