import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String, // start time
      required: true
    },
    endTime: {
      type: String, // end time
      required: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0.25
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
