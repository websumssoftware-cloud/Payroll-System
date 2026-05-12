import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Search, Calendar, User, Clock, ExternalLink } from 'lucide-react';

const VisitMonitoring = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('https://payroll-system-abxy.onrender.com/api/visits/all', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Visit Monitoring</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time location logs and field visit history for all employees.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline"><Calendar size={18} /> Today</button>
                    <button className="btn btn-outline"><Search size={18} /> Filter</button>
                </div>
            </header>

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Location (Lat/Long)</th>
                                <th>Timestamp</th>
                                <th>Visit Notes</th>
                                <th style={{ textAlign: 'right' }}>Map View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map((log) => (
                                <tr key={log._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                {log.employee?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{log.employee?.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {log.employee?.employeeId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '500', fontSize: '0.85rem' }}>
                                            <MapPin size={14} />
                                            {log.location.lat.toFixed(4)}, {log.location.lng.toFixed(4)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {log.notes || 'No notes provided'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <a 
                                            href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn btn-outline"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                        >
                                            Open Map <ExternalLink size={12} />
                                        </a>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No visit logs found for the selected period.
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

export default VisitMonitoring;
