import { connectDB } from '../../../../../lib/db.js';
import { Student } from '../../../../../model/index.js';

export async function PUT(_, { params }) {
  await connectDB();

  const student = await Student.findByIdAndUpdate(
    params.id,
    { balance: 0 },
    { new: true }
  );

  return Response.json(student);
}
