import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    hours: { type: Number,default: 1, min: 1
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

export default mongoose.models.Class ||
  mongoose.model('Class', ClassSchema);
