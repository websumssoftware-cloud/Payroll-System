import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, 
    Search, 
    Download, 
    Filter,
    Clock,
    User,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const AttendanceLog = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('https://payroll-system-abxy.onrender.com/api/attendance/summary', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setLogs(res.data.attendance);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>Attendance Records</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Daily punch logs and working hour summaries</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '12px' }}>
                        <Calendar size={18} /> Select Date
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '12px', background: '#10b981' }}>
                        <Download size={18} /> Download Report
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
                <div style={{ 
                    padding: '1.5rem 2rem', 
                    background: '#f8fafc', 
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search employee name..." 
                            style={{ 
                                width: '100%', 
                                padding: '12px 12px 12px 48px', 
                                borderRadius: '14px', 
                                border: '1px solid #e2e8f0',
                                outline: 'none'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Showing: Today's Logs</span>
                    </div>
                </div>

                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '1.2rem 2rem' }}>Employee</th>
                                <th>Date</th>
                                <th>First In</th>
                                <th>Last Out</th>
                                <th>Work Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={log._id}>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: '700' }}>
                                                {log.employee?.name[0]}
                                            </div>
                                            <span style={{ fontWeight: '600' }}>{log.employee?.name}</span>
                                        </div>
                                    </td>
                                    <td>{log.date}</td>
                                    <td style={{ color: '#10b981', fontWeight: '600' }}>
                                        <ArrowUpRight size={14} /> {log.punches.find(p => p.type === 'In')?.time || '--:--'}
                                    </td>
                                    <td style={{ color: '#ef4444', fontWeight: '600' }}>
                                        <ArrowDownRight size={14} /> {log.punches.slice().reverse().find(p => p.type === 'Out')?.time || '--:--'}
                                    </td>
                                    <td style={{ fontWeight: '700' }}>{log.totalWorkingHours}</td>
                                    <td>
                                        <span className={`badge ${
                                            log.status === 'Checked In' ? 'badge-success' : 
                                            log.status === 'Absent' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceLog;
