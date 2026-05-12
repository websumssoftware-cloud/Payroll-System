const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: String, // e.g., "May 2026"
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  presentDays: {
    type: Number,
    required: true
  },
  absentDays: {
    type: Number,
    required: true
  },
  leavesTaken: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  finalSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Salary', salarySchema);
