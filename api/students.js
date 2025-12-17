import { connectDB } from '../lib/db.js';
import { Student } from '../model/index.js';

export default async function handler(req, res) {
    try {
        await connectDB();

        if (req.method === 'GET') {
            const students = await Student.find();
            return res.status(200).json(students);
        }

        if (req.method === 'POST') {
            const body = req.body;
            const { initialBalance } = body;
            const balance = parseFloat(initialBalance) || 0;
            const student = new Student({ ...body, balance });
            await student.save();
            return res.status(201).json(student);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(`Error in ${req.url}:`, error);
        return res.status(500).json({ error: error.message });
    }
}
