const mongoose = require('mongoose');

const SalaryRecordSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    workingDays: { type: Number, required: true },
    approvedLeaves: { type: Number, default: 0 },
    baseSalary: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    finalSalary: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Paid'], default: 'Draft' }
}, { timestamps: true });

module.exports = mongoose.model('SalaryRecord', SalaryRecordSchema);
