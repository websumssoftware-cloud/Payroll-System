import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, 
    Calendar, 
    MapPin, 
    Clock,
    UserCheck,
    AlertCircle,
    Activity,
    LogOut,
    LogIn
} from 'lucide-react';
import { API_URL } from '../config';

const Dashboard = ({ user }) => {
    const [realStats, setRealStats] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        if (isAdmin) {
            fetchAdminStats();
            fetchEmployees();
            fetchAllAttendance();
            const statsInterval = setInterval(() => {
                fetchAdminStats();
                fetchAllAttendance();
            }, 10000); // Refresh every 10s
            return () => {
                clearInterval(timer);
                clearInterval(statsInterval);
            };
        }
        return () => clearInterval(timer);
    }, [isAdmin]);

    const fetchAdminStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees/dashboard-stats`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setRealStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setEmployees(res.data.filter(e => e.role === 'Employee'));
        } catch (err) { console.error(err); }
    };

    const fetchAllAttendance = async () => {
        try {
            const res = await axios.get(`${API_URL}/attendance`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setAllAttendance(res.data);
        } catch (err) { console.error(err); }
    };

    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        if (isAdmin) {
            fetchLeaves();
        }
    }, [isAdmin]);

    const fetchLeaves = async () => {
        try {
            const res = await axios.get(`${API_URL}/leaves/all`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setLeaves(res.data.filter(l => l.status === 'Pending'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await axios.put(`${API_URL}/leaves/${id}`, { status }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            fetchLeaves();
            fetchAdminStats();
        } catch (err) {
            console.error(err);
        }
    };
    const stats = [
        { label: 'Total Strength', value: realStats?.totalEmployees || '0', icon: Users, color: '#3b82f6', bg: '#eff6ff', trend: '+2 this week' },
        { label: 'Currently In', value: realStats?.activeToday || '0', icon: UserCheck, color: '#10b981', bg: '#ecfdf5', trend: 'Live' },
        { label: 'Pending Approvals', value: realStats?.pendingLeaves || '0', icon: AlertCircle, color: '#f59e0b', bg: '#fffbeb', trend: 'Action Needed' },
        { label: 'Visits Recorded', value: realStats?.totalVisitsToday || '0', icon: MapPin, color: '#8b5cf6', bg: '#f5f3ff', trend: 'Today' },
    ];

    return (
        <div className="animate-fade">
            <header style={{ 
                marginBottom: '2.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end',
                background: 'white',
                padding: '2rem',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e293b' }}>
                        Dashboard Overview <span style={{ fontSize: '1.2rem', fontWeight: '400', color: 'var(--text-muted)' }}>| WebSum Admin</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Welcome back, <strong>{user?.name}</strong>. Here's what's happening today.
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '-5px' }}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </header>

            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card" style={{ padding: '1.8rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ 
                            position: 'absolute', 
                            top: '-10px', 
                            right: '-10px', 
                            width: '80px', 
                            height: '80px', 
                            background: stat.bg, 
                            borderRadius: '50%', 
                            opacity: 0.4 
                        }}></div>
                        <div className="stat-icon" style={{ background: stat.bg, color: stat.color, marginBottom: '1rem', width: '60px', height: '60px' }}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1e293b' }}>{stat.value}</h3>
                            <p style={{ fontSize: '0.8rem', color: stat.color, fontWeight: '700', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Activity size={14} /> {stat.trend}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', marginTop: '2.5rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontWeight: '800', fontSize: '1.4rem', color: '#1e293b' }}>Live Attendance Feed</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time tracking and daily attendance logs</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ 
                                        padding: '8px 12px', 
                                        borderRadius: '12px', 
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: '#334155'
                                    }}
                                />
                                <div className="badge badge-primary" style={{ height: 'fit-content', alignSelf: 'center' }}>{selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 'Historical'}</div>
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Search employee by name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 45px',
                                    borderRadius: '15px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontSize: '0.95rem'
                                }}
                            />
                            <Users size={18} style={{ position: 'absolute', left: '15px', top: '13px', color: '#94a3b8' }} />
                        </div>
                    </div>
                    
                    <div className="table-container" style={{ border: 'none' }}>
                        <table style={{ borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                            <thead>
                                <tr style={{ background: 'transparent' }}>
                                    <th style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Employee</th>
                                    <th style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</th>
                                    <th style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees
                                    .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((emp, i) => {
                                        const attendance = allAttendance.find(att => 
                                            (att.employee?._id === emp._id || att.employee === emp._id) && 
                                            att.date === selectedDate
                                        );
                                        
                                        const lastPunch = attendance?.punches?.[attendance.punches.length - 1];
                                        const isPresent = attendance?.status === 'Checked In';

                                        return (
                                            <tr key={emp._id} style={{ background: '#f8fafc', borderRadius: '16px' }}>
                                                <td style={{ borderRadius: '16px 0 0 16px', border: 'none', padding: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ 
                                                            width: '45px', 
                                                            height: '45px', 
                                                            borderRadius: '12px', 
                                                            background: isPresent ? '#ecfdf5' : '#fff1f2', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            fontWeight: '800',
                                                            color: isPresent ? '#10b981' : '#ef4444',
                                                            fontSize: '1.1rem',
                                                            border: '2px solid white',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}>{emp.name[0]}</div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{emp.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{emp.designation || 'Staff'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ border: 'none', fontWeight: '700', color: isPresent ? '#1e293b' : '#94a3b8' }}>
                                                    {lastPunch?.time || '---'}
                                                </td>

                                                <td style={{ borderRadius: '0 16px 16px 0', border: 'none', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        padding: '6px 14px', 
                                                        borderRadius: '10px', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: '900',
                                                        background: isPresent ? '#dcfce7' : '#fee2e2',
                                                        color: isPresent ? '#16a34a' : '#ef4444',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {isPresent ? 'PRESENT' : 'ABSENT'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontWeight: '800', fontSize: '1.3rem' }}>Action Required</h3>
                        <span style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>{leaves.length} New</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {leaves.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No pending requests</p>
                        ) : leaves.map((req, i) => (
                            <div key={i} style={{ 
                                padding: '1.5rem', 
                                background: '#f8fafc', 
                                borderRadius: '20px', 
                                border: '1px solid #e2e8f0',
                                transition: 'transform 0.2s ease'
                            }} className="request-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>{req.employeeId?.name || 'Employee'}</p>
                                    <span className="badge badge-warning">{req.leaveType}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                                    Reason: {req.reason} • <strong>{new Date(req.startDate).toLocaleDateString()}</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                                        onClick={() => handleLeaveAction(req._id, 'Approved')}
                                    >Approve</button>
                                    <button 
                                        className="btn btn-outline" 
                                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem', color: '#ef4444', borderColor: '#fee2e2' }}
                                        onClick={() => handleLeaveAction(req._id, 'Rejected')}
                                    >Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
