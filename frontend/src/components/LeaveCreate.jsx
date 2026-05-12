import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

const LeaveManagement = ({ admin }) => {
    const [leaves, setLeaves] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ fromDate: '', toDate: '', reason: '' });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const endpoint = admin ? '/api/leaves/all' : '/api/leaves/my';
            const res = await axios.get(`http://localhost:5000${endpoint}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/leaves/apply', formData, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setShowForm(false);
            fetchLeaves();
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/leaves/status/${id}`, { status }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            fetchLeaves();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{admin ? 'Leave Approvals' : 'My Leave Requests'}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{admin ? 'Review and manage team time-off requests' : 'Apply for leaves and track approval status'}</p>
                </div>
                {!admin && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Plus size={18} /> Apply for Leave
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>New Leave Request</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input type="date" className="form-input" value={formData.fromDate} onChange={e => setFormData({...formData, fromDate: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input type="date" className="form-input" value={formData.toDate} onChange={e => setFormData({...formData, toDate: e.target.value})} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reason</label>
                            <textarea className="form-input" rows="3" placeholder="Explain your reason for leave..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Request</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                {admin && <th>Employee</th>}
                                <th>Dates</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Status</th>
                                {admin && <th style={{ textAlign: 'right' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length > 0 ? leaves.map((leave) => {
                                const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
                                return (
                                    <tr key={leave._id}>
                                        {admin && (
                                            <td>
                                                <p style={{ fontWeight: '600' }}>{leave.employee?.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.employee?.employeeId}</p>
                                            </td>
                                        )}
                                        <td>
                                            <div style={{ fontSize: '0.9rem' }}>
                                                {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>{days} Days</td>
                                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={leave.reason}>
                                            {leave.reason}
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                leave.status === 'Approved' ? 'badge-success' : 
                                                leave.status === 'Rejected' ? 'badge-danger' : 
                                                'badge-warning'
                                            }`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        {admin && (
                                            <td style={{ textAlign: 'right' }}>
                                                {leave.status === 'Pending' && (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-primary" style={{ padding: '6px 12px', background: 'var(--success)' }} onClick={() => updateStatus(leave._id, 'Approved')}>
                                                            Approve
                                                        </button>
                                                        <button className="btn btn-primary" style={{ padding: '6px 12px', background: 'var(--danger)' }} onClick={() => updateStatus(leave._id, 'Rejected')}>
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={admin ? "6" : "4"} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No leave requests found.
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

export default LeaveManagement;
