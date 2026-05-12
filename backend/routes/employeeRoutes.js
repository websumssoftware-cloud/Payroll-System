const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const VisitLog = require('../models/VisitLog');
const LeaveRequest = require('../models/LeaveRequest');

// @route   GET api/employees/dashboard-stats
// @desc    Get counts for admin dashboard
router.get('/dashboard-stats', async (req, res) => {

    try {
        const today = new Date().toISOString().split('T')[0];
        const totalEmployees = await Employee.countDocuments({ role: 'Employee' });
        const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
        
        // Real-time active today: Employees who are currently 'Checked In'
        const Attendance = require('../models/Attendance');
        const activeToday = await Attendance.countDocuments({
            date: today,
            status: 'Checked In'
        });

        const totalVisitsToday = await VisitLog.countDocuments({
            timestamp: { $gte: new Date().setHours(0,0,0,0) }
        });

        res.json({
            totalEmployees,
            activeToday,
            pendingLeaves,
            totalVisitsToday
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find().select('-password');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST api/employees
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    const { name, email, password, employeeId, role, department, designation } = req.body;

    try {
        let employee = await Employee.findOne({ email });
        if (employee) return res.status(400).json({ message: 'Employee already exists' });

        employee = new Employee({
            name, email, password, employeeId, role, department, designation
        });

        const salt = await bcrypt.genSalt(10);
        employee.password = await bcrypt.hash(password, salt);

        await employee.save();
        res.status(201).json(employee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT api/employees/:id
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    try {
        let employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).select('-password');
        res.json(employee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE api/employees/:id
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
