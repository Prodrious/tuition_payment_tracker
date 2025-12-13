import { connectDB } from '@/lib/db';
import { Student } from '@/models';

export async function PUT(_, { params }) {
  await connectDB();

  const student = await Student.findByIdAndUpdate(
    params.id,
    { balance: 0 },
    { new: true }
  );

  return Response.json(student);
}
