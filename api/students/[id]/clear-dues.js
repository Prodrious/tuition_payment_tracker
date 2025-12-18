import { connectDB } from '../../../lib/db.js';
import { Student } from '../../../model/index.js';

export default async function handler(req, res) {
    const { id } = req.query;

    try {
        await connectDB();

        if (req.method === 'PUT') {
            const student = await Student.findByIdAndUpdate(
                id,
                { balance: 0 },
                { new: true }
            );

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            return res.status(200).json(student);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(`Error in ${req.url}:`, error);
        return res.status(500).json({ error: error.message });
    }
}
