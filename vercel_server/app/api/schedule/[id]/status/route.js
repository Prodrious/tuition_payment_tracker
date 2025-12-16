import { connectDB } from '../../../../../lib/db.js';
import { Student, Class } from '../../../../../model/index.js';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { status } = await req.json();

    const cls = await Class.findById(id);

    if (!cls) {
      return Response.json({ error: 'Class not found' }, { status: 404 });
    }

    if (status === 'COMPLETED' && cls.status !== 'COMPLETED') {
      const student = await Student.findById(cls.studentId);
      if (student) {
        const rate = student.rate;
        const balance =
          student.type === 'UPFRONT'
            ? student.balance - rate
            : student.balance + rate;

        await Student.findByIdAndUpdate(student._id, { balance });
      }
    }

    cls.status = status;
    await cls.save();

    return Response.json(cls);
  } catch (error) {
    console.error('PUT /api/schedule/[id]/status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
