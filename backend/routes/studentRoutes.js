const express = require('express');
const router = express.Router();
const Student = require('../models/student'); // Adjust capitalization to '../models/Student' if your model filename starts with uppercase 'S'

// GET all students (with optional search filtering)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { roomNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new student record
router.post('/', async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update existing student details (or toggle rent status)
router.put('/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE student record
router.delete('/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST new student record with Room Capacity Check
router.post('/', async (req, res) => {
  try {
    const MAX_CAPACITY = 2; // Set max capacity per room
    const existingCount = await Student.countDocuments({ roomNumber: req.body.roomNumber });

    if (existingCount >= MAX_CAPACITY) {
      return res.status(400).json({ error: `Room ${req.body.roomNumber} is full! (Max ${MAX_CAPACITY} students)` });
    }

    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;