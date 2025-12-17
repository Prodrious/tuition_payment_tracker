import { connectDB } from '../../../lib/db.js'; // api/students/[id]/archive.js -> ../../../../lib
import { Student, Class } from '../../../model/index.js';

export default async function handler(req, res) {
    const { id } = req.query; // "id" from path /students/:id/archive - wait.
    // In Vercel file routing, [id] folder captures the param.
    // api/students/[id]/archive.js matches /api/students/123/archive.
    // req.query should contain "id".

    try {
        await connectDB();

        if (req.method === 'PUT') {
            const student = await Student.findByIdAndUpdate(
                id,
                { isArchived: true },
                { new: true }
            );

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            await Class.deleteMany({
                studentId: id,
                status: 'PENDING'
            });

            return res.status(200).json(student);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(`Error in ${req.url}:`, error);
        return res.status(500).json({ error: error.message });
    }
}
