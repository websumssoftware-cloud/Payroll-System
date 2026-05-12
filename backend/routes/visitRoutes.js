const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const VisitLog = require('../models/VisitLog');
const mongoose = require('mongoose');

// Log a new visit (Initial Site Record)
router.post('/log', async (req, res) => {
  try {
    const { employeeId, clientName, purpose, location, imageUrl } = req.body;
    
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });
    if (!clientName) return res.status(400).json({ message: 'Client Name is required' });
    if (!purpose) return res.status(400).json({ message: 'Visit Purpose is required' });

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: `Invalid Employee ID format: ${employeeId}` });
    }

    const newVisit = new Visit({
      employeeId,
      clientName,
      purpose,
      location: location || { lat: 18.52, lng: 73.85, address: 'Field Location' },
      imageUrl: imageUrl || ""
    });

    await newVisit.save();
    res.status(201).json({ message: 'Visit logged successfully', visit: newVisit });
  } catch (error) {
    console.error('Visit Log Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Track movement (Periodic location updates)
router.post('/track', async (req, res) => {
  try {
    const { employeeId, location, notes } = req.body;
    if (!employeeId || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Missing tracking data' });
    }

    const newLog = new VisitLog({
      employee: employeeId,
      location,
      notes: notes || 'Periodic Tracking'
    });

    await newLog.save();
    res.status(201).json({ message: 'Location tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Tracking Error', error: error.message });
  }
});

// Get All Visits (For Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const visits = await Visit.find().populate('employeeId', 'name designation').sort({ timestamp: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visits', error: error.message });
  }
});

// Get Tracking Logs (For Admin to see movement)
router.get('/tracking/:employeeId', async (req, res) => {
  try {
    const logs = await VisitLog.find({ employee: req.params.employeeId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});

// Get visits for an employee (For Mobile App History)
router.get('/employee/:employeeId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid Employee ID' });
    }
    const visits = await Visit.find({ employeeId: req.params.employeeId }).sort({ timestamp: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visits', error: error.message });
  }
});

module.exports = router;
