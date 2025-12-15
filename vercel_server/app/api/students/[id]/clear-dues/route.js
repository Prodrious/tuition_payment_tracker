import { connectDB } from '../../../../../lib/db.js';
import { Student } from '../../../../../model/index.js';

export async function PUT(_, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findByIdAndUpdate(
      id,
      { balance: 0 },
      { new: true }
    );

    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    return Response.json(student);
  } catch (error) {
    console.error('PUT /api/students/[id]/clear-dues error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
