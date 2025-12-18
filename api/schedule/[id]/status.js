import { connectDB } from '../../../lib/db.js';
import { Student, Class } from '../../../model/index.js';

export default async function handler(req, res) {
    const { id } = req.query;

    try {
        await connectDB();

        if (req.method === 'PUT') {
            const body = req.body;
            const { status } = body;

            const cls = await Class.findById(id);

            if (!cls) {
                return res.status(404).json({ error: 'Class not found' });
            }

            if (status === 'COMPLETED' && cls.status !== 'COMPLETED') {
                const student = await Student.findById(cls.studentId);
                if (student) {
                    const rate = student.rate;
                    const balance =
                        student.type === 'UPFRONT'
                            ? student.balance - rate
                            : student.balance + rate;

                    await Student.findByIdAndUpdate(student._id, { balance });
                }
            }

            cls.status = status;
            await cls.save();

            return res.status(200).json(cls);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(`Error in ${req.url}:`, error);
        return res.status(500).json({ error: error.message });
    }
}
