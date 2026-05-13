import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, 
    Plus, 
    MoreVertical, 
    Mail, 
    Phone, 
    Briefcase, 
    MapPin,
    Filter,
    Download
} from 'lucide-react';
import { API_URL } from '../config';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>Employee Directory</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your team and their access levels</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '12px' }}>
                        <Download size={18} /> Export
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: '12px', background: '#3b82f6' }}>
                        <Plus size={18} /> Add Employee
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
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name, department or ID..." 
                            style={{ 
                                width: '100%', 
                                padding: '12px 12px 12px 48px', 
                                borderRadius: '14px', 
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-outline" style={{ padding: '10px', borderRadius: '10px' }}><Filter size={18} /></button>
                    </div>
                </div>

                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '1.2rem 2rem' }}>Employee</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp, i) => (
                                <tr key={emp._id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ 
                                                width: '48px', 
                                                height: '48px', 
                                                borderRadius: '16px', 
                                                background: `linear-gradient(135deg, #3b82f6, #6366f1)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '800',
                                                fontSize: '1.1rem',
                                                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                                            }}>
                                                {emp.name[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{emp.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Mail size={12} /> {emp.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Briefcase size={14} color="#64748b" />
                                            <span style={{ fontWeight: '500' }}>{emp.department || 'General'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '8px', 
                                            background: emp.role === 'Admin' ? '#f5f3ff' : '#eff6ff', 
                                            color: emp.role === 'Admin' ? '#7c3aed' : '#2563eb',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase'
                                        }}>
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ 
                                                width: '10px', 
                                                height: '10px', 
                                                borderRadius: '50%', 
                                                background: emp.status === 'Active' ? '#10b981' : '#cbd5e1',
                                                boxShadow: emp.status === 'Active' ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                                            }}></div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{emp.status || 'Active'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                                        <button style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            color: '#94a3b8', 
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            transition: 'background 0.2s'
                                        }} onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                           onMouseOut={(e) => e.currentTarget.style.background = 'none'}>
                                            <MoreVertical size={20} />
                                        </button>
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

export default EmployeeList;
