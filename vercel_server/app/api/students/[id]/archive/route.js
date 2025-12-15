import { connectDB } from '../../../../../lib/db.js';
import { Student, Class } from '../../../../../model/index.js';

export async function PUT(_, { params }) {
  await connectDB();

  const student = await Student.findByIdAndUpdate(
    params.id,
    { isArchived: true },
    { new: true }
  );

  await Class.deleteMany({
    studentId: params.id,
    status: 'PENDING'
  });

  return Response.json(student);
}
