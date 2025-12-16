import { connectDB } from '../../../../../lib/db.js';
import { Student, Class } from '../../../../../model/index.js';

export async function PUT(_, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    );

    if (!student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    await Class.deleteMany({
      studentId: id,
      status: 'PENDING'
    });

    return Response.json(student);
  } catch (error) {
    console.error('PUT /api/students/[id]/archive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
