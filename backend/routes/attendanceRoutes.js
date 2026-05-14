const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// Punch In/Out
router.post('/punch', async (req, res) => {
  try {
    const { employeeId, type, location } = req.body;
    const date = new Date().toISOString().split('T')[0];

    // Note: Model uses 'employee' instead of 'employeeId'
    let attendance = await Attendance.findOne({ employee: employeeId, date });

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date,
        status: 'Not in Yet',
        punches: []
      });
    }

    attendance.punches.push({
      type, // 'In' or 'Out'
      time: new Date().toLocaleTimeString(),
      location
    });

    // Sync with model status enum
    attendance.status = type === 'In' ? 'Checked In' : 'Not in Yet';
    await attendance.save();

    res.json({ message: `Successfully punched ${type}`, attendance });
  } catch (error) {
    console.error('Punch Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get All Attendance (For Admin)
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('employee', 'name employeeId designation department').sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

// Get Attendance History for an employee
router.get('/history/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid Employee ID format' });
    }

    // Note: Model uses 'employee'
    const history = await Attendance.find({ employee: employeeId }).sort({ date: -1 });
    res.json(history || []);
  } catch (error) {
    console.error('Attendance History Error:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

module.exports = router;
