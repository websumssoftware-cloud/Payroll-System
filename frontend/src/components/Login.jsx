import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, Mail, Lock, Shield } from 'lucide-react';

const Login = ({ setAuth }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('https://payroll-system-abxy.onrender.com/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setAuth(res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <div className="card animate-fade" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
                        <Shield size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>ETS Portal</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to manage your tracking</p>
                </div>

                {error && <div style={{ padding: '10px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="email" 
                                className="form-input" 
                                style={{ paddingLeft: '40px' }}
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="password" 
                                className="form-input" 
                                style={{ paddingLeft: '40px' }}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'} <LogIn size={18} />
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Admin: admin@ets.com / 123456
                </div>
            </div>
        </div>
    );
};

export default Login;
