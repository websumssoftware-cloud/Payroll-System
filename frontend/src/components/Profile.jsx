import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Shield, CheckCircle } from 'lucide-react';

const Profile = ({ user }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });
    const [success, setSuccess] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/employees/${user.id}`, formData, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: '800' }}>My Profile</h2>
                <p style={{ color: 'var(--text-muted)' }}>Manage your personal information and contact details.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', height: 'fit-content' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', margin: '0 auto 1.5rem' }}>
                        {user?.name?.charAt(0)}
                    </div>
                    <h3 style={{ fontWeight: '700', fontSize: '1.25rem' }}>{user?.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{user?.role}</p>
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.85rem' }}>
                            <Shield size={16} color="var(--primary)" />
                            <span>ID: {user?.employeeId || 'EMP001'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                            <Mail size={16} color="var(--primary)" />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>Personal Details</h3>
                    
                    {success && (
                        <div style={{ padding: '12px', background: '#ecfdf5', color: '#065f46', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <CheckCircle size={18} /> Profile updated successfully!
                        </div>
                    )}

                    <form onSubmit={handleUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" className="form-input" style={{ paddingLeft: '40px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="email" className="form-input" style={{ paddingLeft: '40px' }} value={formData.email} disabled />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" className="form-input" style={{ paddingLeft: '40px' }} placeholder="+91 00000 00000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" className="form-input" style={{ paddingLeft: '40px' }} placeholder="City, State" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
