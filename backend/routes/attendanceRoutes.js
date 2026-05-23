const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// Helper to calculate total hours from punches
const calculateTotalHours = (punches) => {
    let totalMs = 0;
    
    // Sort punches by timestamp to ensure correct order
    const sortedPunches = [...punches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    for (let i = 0; i < sortedPunches.length; i++) {
        if (sortedPunches[i].type === 'In') {
            const nextPunch = sortedPunches[i + 1];
            
            if (nextPunch && nextPunch.type === 'Out') {
                // Valid pair
                const diff = new Date(nextPunch.timestamp) - new Date(sortedPunches[i].timestamp);
                totalMs += Math.abs(diff);
                i++; // Skip the 'Out' punch
            } else {
                // Missing 'Out' - Auto punch out logic
                const punchInTime = new Date(sortedPunches[i].timestamp);
                const autoOut = new Date(punchInTime);
                autoOut.setHours(12, 0, 0, 0); 
                
                if (autoOut <= punchInTime) {
                    autoOut.setHours(23, 59, 59, 999);
                }
                
                if (new Date() > autoOut) {
                    const diff = autoOut - punchInTime;
                    totalMs += Math.abs(diff);
                }
            }
        }
    }
    
    const totalMinutes = Math.floor(totalMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`; // Removed zero padding to match dash-less style if preferred, or keep it clean
};

// Punch In/Out
router.post('/punch', async (req, res) => {
  try {
    const { employeeId, type, location } = req.body;
    const now = new Date();
    // Get YYYY-MM-DD in local timezone
    const date = now.toLocaleDateString('en-CA'); 

    let attendance = await Attendance.findOne({ employee: employeeId, date });

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date,
        status: 'Not in Yet',
        punches: []
      });
    }

    // Add the new punch
    attendance.punches.push({
      type, // 'In' or 'Out'
      time: now.toLocaleTimeString(),
      timestamp: now,
      location: typeof location === 'string' ? { address: location } : location
    });

    // Calculate total hours so far
    attendance.totalWorkingHours = calculateTotalHours(attendance.punches);

    // Update status
    if (type === 'In') {
        const punchHour = now.getHours();
        // If it's the first 'In' punch of the day and it's 10 AM or later
        const inPunches = attendance.punches.filter(p => p.type === 'In');
        if (punchHour >= 10 && inPunches.length === 1) {
            attendance.status = 'Late';
        } else if (attendance.status !== 'Late') {
            attendance.status = 'Checked In';
        }
    } else {
        // When punching out, we keep the status as 'Checked In' or 'Late' 
        // to show they were present today, unless you prefer 'Not in Yet'
        if (attendance.status === 'Checked In' || attendance.status === 'Late') {
            // Keep current status
        } else {
            attendance.status = 'Not in Yet';
        }
    }
    
    await attendance.save();

    res.json({ 
        message: `Successfully punched ${type}`, 
        attendance,
        totalHours: attendance.totalWorkingHours
    });
  } catch (error) {
    console.error('Punch Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get All Attendance (For Admin)
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find()
        .populate('employee', 'name employeeId designation department')
        .sort({ date: -1 });
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

    const history = await Attendance.find({ employee: employeeId }).sort({ date: -1 });
    res.json(history || []);
  } catch (error) {
    console.error('Attendance History Error:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

module.exports = router;
