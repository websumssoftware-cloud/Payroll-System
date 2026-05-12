const mongoose = require('mongoose');

const PunchSchema = new mongoose.Schema({
    time: { type: String, required: true },
    type: { type: String, enum: ['In', 'Out'], required: true },
    location: {
        lat: Number,
        lng: Number,
        address: String
    }
});

const AttendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    punches: [PunchSchema],
    totalWorkingHours: { type: String, default: '00h 00m' },
    totalBreakHours: { type: String, default: '00h 00m' },
    overtimeHours: { type: String, default: '00h 00m' },
    status: { type: String, enum: ['Checked In', 'Not in Yet', 'Time Off', 'Absent'], default: 'Not in Yet' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
