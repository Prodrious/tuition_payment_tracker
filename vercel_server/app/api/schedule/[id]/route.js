import { connectDB } from '../../../../lib/db.js';
import { Class } from '../../../../model/index.js';

export async function DELETE(_, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Class.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json({ error: 'Class not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/schedule/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
