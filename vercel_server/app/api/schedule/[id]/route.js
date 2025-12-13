import { connectDB } from '@/lib/db';
import { Class } from '@/models';

export async function DELETE(_, { params }) {
  await connectDB();
  await Class.findByIdAndDelete(params.id);
  return Response.json({ success: true });
}
