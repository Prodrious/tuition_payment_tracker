import { connectDB } from '../../../lib/db.js';
import { Class } from '../../../model/index.js';

export async function GET() {
  await connectDB();
  const classes = await Class.find();
  return Response.json(classes);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const cls = new Class(body);
  await cls.save();
  return Response.json(cls);
}
