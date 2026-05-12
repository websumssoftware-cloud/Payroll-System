import React from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';

const Header = ({ user }) => {
    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem'  }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        style={{ 
                            background: '#f1f5f9', 
                            border: 'none', 
                            padding: '8px 12px 8px 40px', 
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                            width: '260px'
                        }} 
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Bell size={20} />
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)' }} className="btn-outline">
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name || 'Admin'}</span>
                    <ChevronDown size={14} color="var(--text-muted)" />
                </div>
            </div>
        </header>
    );
};

export default Header;
