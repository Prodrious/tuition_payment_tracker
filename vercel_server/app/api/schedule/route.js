import { connectDB } from '../../../lib/db.js';
import { Class } from '../../../model/index.js';

export async function GET() {
  try {
    await connectDB();
    const classes = await Class.find();
    return Response.json(classes);
  } catch (error) {
    console.error('GET /api/schedule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const cls = new Class(body);
    await cls.save();
    return Response.json(cls);
  } catch (error) {
    console.error('POST /api/schedule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
