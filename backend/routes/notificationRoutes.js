const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Get all notifications (For Admin)
router.get('/all', async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('employee', 'name')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// Get all notifications for an employee
router.get('/:employeeId', async (req, res) => {
    try {
        const notifications = await Notification.find({ employee: req.params.employeeId })
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// Mark notification as read
router.put('/read/:id', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});

// Create a notification (Internal use or manual)
router.post('/', async (req, res) => {
    try {
        const { employee, title, message, type } = req.body;
        const newNotif = new Notification({ employee, title, message, type });
        await newNotif.save();
        res.status(201).json(newNotif);
    } catch (error) {
        res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
});

module.exports = router;
