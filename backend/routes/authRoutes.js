const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// @route   POST api/auth/login
// @desc    Authenticate employee & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: employee.id,
                role: employee.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { 
                    id: employee.id, 
                    name: employee.name, 
                    role: employee.role, 
                    email: employee.email,
                    designation: employee.designation,
                    phone: employee.phone,
                    profileImage: employee.profileImage
                } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/me
// @desc    Get logged in user
router.get('/me', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const employee = await Employee.findById(decoded.user.id).select('-password');
        res.json(employee);
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
});

module.exports = router;
