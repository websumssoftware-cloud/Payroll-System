import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Download, Printer, Calculator, Filter, Search } from 'lucide-react';

const SalaryManagement = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRunModal, setShowRunModal] = useState(false);
    const [runData, setRunData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), baseSalary: 25000 });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/salary/all', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setRecords(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunPayroll = async (e) => {
        e.preventDefault();
        try {
            // Fetch all employees first
            const empRes = await axios.get('http://localhost:5000/api/employees', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            
            // For each employee, run calculation
            // In a real app, this would be a single bulk endpoint
            for (const emp of empRes.data) {
                if (emp.role === 'Employee') {
                    await axios.post('http://localhost:5000/api/salary/calculate', {
                        employeeId: emp._id,
                        ...runData
                    }, {
                        headers: { 'x-auth-token': localStorage.getItem('token') }
                    });
                }
            }
            
            setShowRunModal(false);
            fetchRecords();
            alert('Payroll processed successfully for all employees.');
        } catch (err) {
            alert('Error processing payroll');
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Salary Management</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Automated payroll calculation based on attendance and leaves</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowRunModal(true)}>
                    <Calculator size={18} /> Run Payroll
                </button>
            </div>

            {showRunModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Run Monthly Payroll</h3>
                        <form onSubmit={handleRunPayroll}>
                            <div className="form-group">
                                <label className="form-label">Month (1-12)</label>
                                <input type="number" className="form-input" min="1" max="12" value={runData.month} onChange={e => setRunData({...runData, month: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Year</label>
                                <input type="number" className="form-input" value={runData.year} onChange={e => setRunData({...runData, year: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Default Base Salary (₹)</label>
                                <input type="number" className="form-input" value={runData.baseSalary} onChange={e => setRunData({...runData, baseSalary: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowRunModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Process All</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Payout (Mo)</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹12,45,000</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                        <Download size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Processed</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>118/124</h3>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0', marginTop: '2rem' }}>
                <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="form-input" placeholder="Search by name or ID..." style={{ paddingLeft: '40px' }} />
                    </div>
                    <button className="btn btn-outline"><Filter size={18} /> Month</button>
                </div>

                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Period</th>
                                <th>Working Days</th>
                                <th>Approved Leaves</th>
                                <th>Base Salary</th>
                                <th>Final Salary</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? records.map((record) => (
                                <tr key={record._id}>
                                    <td>
                                        <p style={{ fontWeight: '600' }}>{record.employee?.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.employee?.employeeId}</p>
                                    </td>
                                    <td>{new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                                    <td>{record.workingDays}/{record.totalDays}</td>
                                    <td>{record.approvedLeaves}</td>
                                    <td>₹{record.baseSalary.toLocaleString()}</td>
                                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>₹{record.finalSalary.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${record.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-outline" style={{ padding: '6px' }} title="Download Payslip">
                                                <Download size={14} />
                                            </button>
                                            <button className="btn btn-outline" style={{ padding: '6px' }} title="Print">
                                                <Printer size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No salary records found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalaryManagement;
