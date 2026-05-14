const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SalaryRecord = require('../models/SalaryRecord');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

// @route   POST api/salary/calculate
// @desc    Calculate salary for an employee (Admin only)
router.post('/calculate', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    const { employeeId, month, year, baseSalary } = req.body;

    try {
        // Simple logic for demonstration: Count attendance and approved leaves
        // This would be more complex in a real system
        const attendanceCount = await Attendance.countDocuments({
            employee: employeeId,
            date: { $regex: `${year}-${String(month).padStart(2, '0')}` },
            status: 'Checked In'
        });

        const leaveCount = await LeaveRequest.countDocuments({
            employee: employeeId,
            status: 'Approved',
            fromDate: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) }
        });

        const totalDaysInMonth = new Date(year, month, 0).getDate();
        const finalSalary = (baseSalary / totalDaysInMonth) * (attendanceCount + leaveCount);

        const newRecord = new SalaryRecord({
            employee: employeeId,
            month,
            year,
            totalDays: totalDaysInMonth,
            workingDays: attendanceCount,
            approvedLeaves: leaveCount,
            baseSalary,
            finalSalary: Math.round(finalSalary),
            status: 'Draft'
        });

        await newRecord.save();
        res.json(newRecord);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/salary/my
router.get('/my', auth, async (req, res) => {
    try {
        const records = await SalaryRecord.find({ employee: req.user.id }).sort({ year: -1, month: -1 });
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/salary/all (Admin only)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    try {
        const records = await SalaryRecord.find().populate('employee', 'name employeeId').sort({ year: -1, month: -1 });
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
