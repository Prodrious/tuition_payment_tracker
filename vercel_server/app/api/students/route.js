import { connectDB } from '@/lib/db';
import { Student } from '@/models';

export async function GET() {
  await connectDB();
  const students = await Student.find();
  return Response.json(students);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const student = new Student(body);
  await student.save();
  return Response.json(student);
}
