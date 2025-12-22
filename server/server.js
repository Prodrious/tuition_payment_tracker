
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Student, Class } = require('./models');

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




/* =====================
   DATABASE CONNECTION
===================== */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ ERROR: MONGODB_URI missing in .env");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

/* =====================
   STUDENT ROUTES
===================== */

// 1. Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Add student
app.post('/api/students', async (req, res) => {
  try {
    const { initialBalance } = req.body;
    const balance = parseFloat(initialBalance) || 0;

    const newStudent = new Student({
      ...req.body,
      balance
    });

    await newStudent.save();
    res.json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Archive student (soft delete)
app.put('/api/students/:id/archive', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    // Remove pending classes
    await Class.deleteMany({
      studentId: req.params.id,
      status: 'PENDING'
    });

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Clear dues
app.put('/api/students/:id/clear-dues', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { balance: 0 },
      { new: true }
    );
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================
   SCHEDULE / CLASS ROUTES
===================== */

// 6. Get schedule
app.get('/api/schedule', async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Add class (WITH HOURS)
app.post('/api/schedule', async (req, res) => {
  try {
    const { studentId, date, time, endTime, hours } = req.body;

    // Validation
    if (!studentId || !date || !time || !endTime || !hours) {
      return res.status(400).json({
        error: 'studentId, date, time, endTime and hours are required'
      });
    }

    const newClass = new Class({
      studentId,
      date,
      time,        // start time
      endTime,     // ✅ store end time
      hours,       // ✅ already calculated
      status: 'PENDING'
    });

    await newClass.save();
    res.json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 8. Update class status (CORRECT BALANCE LOGIC)
app.put('/api/schedule/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const cls = await Class.findById(req.params.id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Apply balance change only once
    if (status === 'COMPLETED' && cls.status !== 'COMPLETED') {
      const student = await Student.findById(cls.studentId);

      if (student) {
        const hours = cls.hours || 1;
        const amount = student.rate * hours;

        let newBalance = student.balance;

        if (student.type === 'UPFRONT') {
          newBalance -= amount;
        } else {
          newBalance += amount;
        }

        await Student.findByIdAndUpdate(student._id, {
          balance: newBalance
        });
      }
    }

    cls.status = status;
    await cls.save();

    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Delete class record
app.delete('/api/schedule/:id', async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server.js

// 👇 ADD THIS EXACT BLOCK 👇
app.put('/api/students/:id/topup', async (req, res) => {
  try {
    const { amount } = req.body;
    const value = parseFloat(amount);

    if (isNaN(value) || value <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { balance: value },
        $push: { 
          payments: { amount: value, date: new Date() } 
        }
      },
      { new: true }
    );

    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// -----------------------------




/* =====================
   SERVER START
===================== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

