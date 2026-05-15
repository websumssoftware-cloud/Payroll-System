import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    MapPin, 
    Calendar, 
    CreditCard, 
    Users, 
    User, 
    LogOut,
    Shield
} from 'lucide-react';
import logo from '../assets/kusum-brand-logo-v2.png'

const Sidebar = ({ user, handleLogout }) => {
    const role = user?.role || 'Employee';

    const menuItems = role === 'Admin' ? [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Admin Dashboard', path: '/' },
        { id: 'employees', icon: Users, label: 'Employee Mgmt', path: '/employees' },
        { id: 'visits', icon: MapPin, label: 'Visit Monitoring', path: '/visits' },
        { id: 'leaves', icon: Calendar, label: 'Leave Approvals', path: '/leaves' },
        { id: 'payroll', icon: CreditCard, label: 'Salary Records', path: '/payroll' },
    ] : [
        { id: 'dashboard', icon: LayoutDashboard, label: 'My Dashboard', path: '/' },
        { id: 'check-in', icon: MapPin, label: 'Visit Logging', path: '/check-in' },
        { id: 'leaves', icon: Calendar, label: 'My Leaves', path: '/leaves' },
        { id: 'salary', icon: CreditCard, label: 'My Salary', path: '/salary' },
        { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="sidebar">
            <div className="brand-box">
                <div className="brand-logo-premium">
                    <img src={logo} alt="Kusum Farm" className="sidebar-logo-img" />
                </div>
                <div className="brand-info">
                    <h1 className="brand-name">KUSUM FARM</h1>
                    <p className="brand-tag">Admin Portal</p>
                </div>
            </div>

            <div style={{ flex: 1 }}>
                {menuItems.map((item) => (
                    <NavLink 
                        key={item.id} 
                        to={item.path} 
                        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <div className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </div>
                
                <div style={{ marginTop: '1rem', padding: '12px', background: 'var(--bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
