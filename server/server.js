// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose'); // Make sure this is 'mongoose', not 'mongose'
// const { Student, Class } = require('./models');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // --- DATABASE CONNECTION (Fixed) ---
// const connectDB = async () => {
//   try {
//     // Check if the Connection String exists
//     if (!process.env.MONGODB_URI) {
//       console.error("❌ ERROR: MONGO_URI is missing in .env file");
//       process.exit(1); // Stop the server if no database
//     }

//     // Connect to MongoDB
//     const conn = await mongoose.connect(process.env.MONGODB_URI);
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

//   } catch (error) {
//     console.error(`❌ Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// // Call the connection function
// connectDB();

// // --- ROUTES ---

// // 1. Get All Students
// app.get('/api/students', async (req, res) => {
//   try {
//     const students = await Student.find();
//     res.json(students);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 2. Add Student
// app.post('/api/students', async (req, res) => {
//   try {
//     const { initialBalance } = req.body;
//     const balance = parseFloat(initialBalance) || 0;
//     const newStudent = new Student({ ...req.body, balance });
//     await newStudent.save();
//     res.json(newStudent);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 3. Edit Student
// app.put('/api/students/:id', async (req, res) => {
//   try {
//     const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updated);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 4. Archive Student (Soft Delete)
// app.put('/api/students/:id/archive', async (req, res) => {
//   try {
//     const student = await Student.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
//     // Remove pending classes for this student
//     await Class.deleteMany({ studentId: req.params.id, status: 'PENDING' });
//     res.json(student);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 5. Clear Dues
// app.put('/api/students/:id/clear-dues', async (req, res) => {
//   try {
//     const student = await Student.findByIdAndUpdate(req.params.id, { balance: 0 }, { new: true });
//     res.json(student);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 6. Get Schedule
// app.get('/api/schedule', async (req, res) => {
//   try {
//     const classes = await Class.find();
//     res.json(classes);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 7. Add Class
// app.post('/api/schedule', async (req, res) => {
//   try {
//     const newClass = new Class(req.body);
//     await newClass.save();
//     res.json(newClass);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 8. Update Class Status
// app.put('/api/schedule/:id/status', async (req, res) => {
//   try {
//     const { status } = req.body;
//     const cls = await Class.findById(req.params.id);

//     if (status === 'COMPLETED' && cls.status !== 'COMPLETED') {
//       const student = await Student.findById(cls.studentId);
//       if (student) {
//         let newBalance = student.balance;
//         const rate = student.rate;
//         student.type === 'UPFRONT' ? (newBalance -= rate) : (newBalance += rate);
//         await Student.findByIdAndUpdate(cls.studentId, { balance: newBalance });
//       }
//     }

//     cls.status = status;
//     await cls.save();
//     res.json(cls);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // 9. Delete Class Record
// app.delete('/api/schedule/:id', async (req, res) => {
//   try {
//     await Class.findByIdAndDelete(req.params.id);
//     res.json({ msg: "Deleted" });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));






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

/* =====================
   SERVER START
===================== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
