import { connectDB } from '@/lib/db';
import { Student } from '@/models';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();

  const updated = await Student.findByIdAndUpdate(
    params.id,
    body,
    { new: true }
  );

  return Response.json(updated);
}
