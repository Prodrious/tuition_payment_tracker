import { connectDB } from '../../../../lib/db.js';
import { Student } from '../../../../model/index.js';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updated = await Student.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    if (!updated) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    console.error('PUT /api/students/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
