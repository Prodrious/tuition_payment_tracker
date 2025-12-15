import { connectDB } from '../../../../lib/db.js';
import { Student } from '../../../../model/index.js';

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
