import { connectDB } from '../../../lib/db.js';
import { Student } from '../../../model/index.js';

export async function GET() {
  try {
    await connectDB();
    const students = await Student.find();
    return Response.json(students);
  } catch (error) {
    console.error('GET /api/students error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { initialBalance } = body;
    const balance = parseFloat(initialBalance) || 0;
    const student = new Student({ ...body, balance });
    await student.save();
    return Response.json(student);
  } catch (error) {
    console.error('POST /api/students error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
