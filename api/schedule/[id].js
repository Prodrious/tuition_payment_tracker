import { connectDB } from '../../lib/db.js';
import { Class } from '../../model/index.js';

export default async function handler(req, res) {
    const { id } = req.query;

    try {
        await connectDB();

        if (req.method === 'DELETE') {
            const deleted = await Class.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ error: 'Class not found' });
            }

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(`Error in ${req.url}:`, error);
        return res.status(500).json({ error: error.message });
    }
}
