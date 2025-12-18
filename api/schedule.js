import { connectDB } from '../lib/db.js';
import { Class } from '../model/index.js';

export default async function handler(req, res) {
    try {
        await connectDB();

        if (req.method === 'GET') {
            const classes = await Class.find();
            return res.status(200).json(classes);
        }

        if (req.method === 'POST') {
            const body = req.body;
            const cls = new Class(body);
            await cls.save();
            return res.status(201).json(cls);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(`Error in ${req.url}:`, error);
        return res.status(500).json({ error: error.message });
    }
}
