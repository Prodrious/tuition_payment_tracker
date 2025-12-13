import { connectDB } from '@/lib/db';
import { Student, Class } from '@/models';

export async function PUT(req, { params }) {
  await connectDB();
  const { status } = await req.json();

  const cls = await Class.findById(params.id);

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
}
