const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Employee'], default: 'Employee' },
    department: { type: String },
    designation: { type: String },
    dateOfJoining: { type: Date },
    branch: { type: String, default: 'Main Branch' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    salary: { type: Number, default: 0 },
    phone: { type: String },
    profileImage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
