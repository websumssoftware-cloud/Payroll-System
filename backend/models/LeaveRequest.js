const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    leaveType: { type: String, enum: ['Sick Leave', 'Paid Leave', 'Casual Leave'], default: 'Sick Leave' },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
