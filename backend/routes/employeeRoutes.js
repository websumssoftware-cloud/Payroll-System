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
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const totalEmployees = await Employee.countDocuments({ role: 'Employee' });
        const employeesWeekly = await Employee.countDocuments({ role: 'Employee', createdAt: { $gte: lastWeek } });
        const employeesMonthly = await Employee.countDocuments({ role: 'Employee', createdAt: { $gte: lastMonth } });

        const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
        const pendingYesterday = await LeaveRequest.countDocuments({ 
            status: 'Pending', 
            createdAt: { $lt: new Date().setHours(0,0,0,0) } 
        });
        
        // Real-time active today: Employees who are currently 'Checked In'
        const Attendance = require('../models/Attendance');
        const activeToday = await Attendance.countDocuments({
            date: today,
            status: 'Checked In'
        });
        const activeYesterday = await Attendance.countDocuments({
            date: yesterdayStr,
            status: 'Checked In'
        });

        const totalVisitsToday = await VisitLog.countDocuments({
            timestamp: { $gte: new Date().setHours(0,0,0,0) }
        });
        const visitsWeekly = await VisitLog.countDocuments({
            timestamp: { $gte: lastWeek }
        });
        const visitsMonthly = await VisitLog.countDocuments({
            timestamp: { $gte: lastMonth }
        });

        res.json({
            totalEmployees,
            employeesWeekly,
            employeesMonthly,
            activeToday,
            activeYesterday,
            pendingLeaves,
            pendingYesterday,
            totalVisitsToday,
            visitsWeekly,
            visitsMonthly
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

// @route   PUT api/employees/profile/update
// @desc    Update employee profile
router.put('/profile/update', auth, async (req, res) => {
    try {
        const { name, phone, email, designation, profileImage } = req.body;
        let employee = await Employee.findById(req.user.id);
        
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        if (name) employee.name = name;
        if (phone) employee.phone = phone;
        if (email) employee.email = email;
        if (designation) employee.designation = designation;
        if (profileImage) employee.profileImage = profileImage;

        await employee.save();
        res.json(employee);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
