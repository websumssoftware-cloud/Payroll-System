const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');

// Apply for Leave
router.post('/apply', async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const newLeave = new LeaveRequest({
      employeeId,
      leaveType,
      fromDate: startDate || new Date(),
      toDate: endDate || new Date(),
      reason
    });
    await newLeave.save();
    res.status(201).json({ message: 'Leave application submitted successfully', leave: newLeave });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting leave application', error: error.message });
  }
});

// Get Employee's Leave History
router.get('/history/:employeeId', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.params.employeeId }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave history', error: error.message });
  }
});

// Get All Leaves (For Admin)
router.get('/', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('employeeId', 'name email').sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leaves', error: error.message });
  }
});

// Update Leave Status (Approve/Reject)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    res.json({ message: `Leave ${status} successfully`, leave: updatedLeave });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error: error.message });
  }
});

module.exports = router;
