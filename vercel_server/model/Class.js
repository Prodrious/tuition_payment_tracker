import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

export default mongoose.models.Class ||
  mongoose.model('Class', ClassSchema);
