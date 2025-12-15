import { connectDB } from '../../../../lib/db.js';
import { Class } from '../../../../model/index.js';

export async function DELETE(_, { params }) {
  await connectDB();
  await Class.findByIdAndDelete(params.id);
  return Response.json({ success: true });
}
