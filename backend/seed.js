const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/payroll_system');
        console.log('Connected to MongoDB for Kusum Farm seeding...');

        // Clear existing data
        await Employee.deleteMany({});
        await Attendance.deleteMany({});
        await LeaveRequest.deleteMany({});
        const Visit = require('./models/Visit');
        await Visit.deleteMany({});

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Create Admin
        const admin = new Employee({
            employeeId: 'ADM001',
            name: 'Kusum Admin',
            email: 'admin@kusum.com',
            password: hashedPassword,
            role: 'Admin',
            department: 'Management',
            designation: 'Farm Manager',
            status: 'Active',
            salary: 75000,
            phone: '9800011122'
        });
        await admin.save();

        // Create Employees
        const employeesData = [
            { id: 'KUS001', name: 'Sagar Deshmukh', email: 'sagar@kusum.com', role: 'Employee', dept: 'Operations', des: 'Field Supervisor', sal: 45000, ph: '9876543201' },
            { id: 'KUS002', name: 'Neha Patil', email: 'neha@kusum.com', role: 'Employee', dept: 'Quality', des: 'Plant Pathologist', sal: 42000, ph: '9876543202' },
            { id: 'KUS003', name: 'Rahul Singh', email: 'rahul@kusum.com', role: 'Employee', dept: 'Logistics', des: 'Delivery Head', sal: 35000, ph: '9876543203' },
            { id: 'KUS004', name: 'Priya Verma', email: 'priya@kusum.com', role: 'Employee', dept: 'Finance', des: 'Accountant', sal: 38000, ph: '9876543204' },
            { id: 'KUS005', name: 'Amit Sharma', email: 'amit@kusum.com', role: 'Employee', dept: 'Operations', des: 'Technician', sal: 28000, ph: '9876543205' },
            { id: 'KUS006', name: 'Sunil Pawar', email: 'sunil@kusum.com', role: 'Employee', dept: 'Operations', des: 'Technician', sal: 28000, ph: '9876543206' },
            { id: 'KUS007', name: 'Maya Kulkarni', email: 'maya@kusum.com', role: 'Employee', dept: 'Logistics', des: 'Driver', sal: 22000, ph: '9876543207' }
        ];

        const employees = [];
        for (const emp of employeesData) {
            const newEmp = new Employee({
                employeeId: emp.id,
                name: emp.name,
                email: emp.email,
                password: hashedPassword,
                role: emp.role,
                department: emp.dept,
                designation: emp.des,
                salary: emp.sal,
                phone: emp.ph,
                status: 'Active'
            });
            await newEmp.save();
            employees.push(newEmp);
        }

        // Attendance Records (Only for some to show Absent logic)
        const today = new Date().toISOString().split('T')[0];
        const presentEmployees = [employees[0], employees[1], employees[3], employees[4], employees[6]]; // Neha is present but has pending leave
        for (const emp of presentEmployees) {
            await Attendance.create({
                employee: emp._id,
                date: today,
                status: 'Checked In',
                punches: [
                    { time: '08:15 AM', type: 'In', location: { lat: 18.5204, lng: 73.8567, address: 'Kusum Farm Main Gate' } }
                ]
            });
        }

        // Visits
        await Visit.create({
            employeeId: employees[0]._id,
            clientName: 'Section B - Mango Grove',
            purpose: 'Soil Quality Inspection',
            location: { lat: 18.5304, lng: 73.8667, address: 'Section B, West Side' },
            timestamp: new Date()
        });

        await Visit.create({
            employeeId: employees[2]._id,
            clientName: 'Market Yard Pune',
            purpose: 'Delivery Coordination',
            location: { lat: 18.5089, lng: 73.8682, address: 'Gultekdi, Pune' },
            timestamp: new Date()
        });

        // Leave Requests
        await LeaveRequest.insertMany([
            {
                employeeId: employees[1]._id,
                fromDate: new Date(),
                toDate: new Date(Date.now() + 172800000),
                reason: 'Family wedding',
                status: 'Pending'
            }
        ]);

        // Salary Records
        const SalaryRecord = require('./models/SalaryRecord');
        await SalaryRecord.deleteMany({});
        
        const months = [
            { m: 3, y: 2026, status: 'Paid' },
            { m: 4, y: 2026, status: 'Paid' },
            { m: 5, y: 2026, status: 'Draft' }
        ];

        for (const monthData of months) {
            for (const emp of employees.slice(0, 3)) { // Add records for first 3 employees
                const totalDays = new Date(monthData.y, monthData.m, 0).getDate();
                const workingDays = totalDays - 2; // Assuming 2 days absent
                const finalSalary = (emp.salary / totalDays) * workingDays;

                await SalaryRecord.create({
                    employee: emp._id,
                    month: monthData.m,
                    year: monthData.y,
                    totalDays,
                    workingDays,
                    approvedLeaves: 1,
                    baseSalary: emp.salary,
                    deductions: Math.round(emp.salary - finalSalary),
                    finalSalary: Math.round(finalSalary),
                    status: monthData.status
                });
            }
        }

        console.log('Kusum Farm Seed Data Integrated! 🌱');
        console.log('Admin Login: admin@kusum.com / 123456');
        process.exit();
    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
};

seedData();
