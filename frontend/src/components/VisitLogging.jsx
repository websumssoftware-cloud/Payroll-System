import React, { useState } from 'react';
import { API_URL } from '../config';
import axios from 'axios';
import { MapPin, Navigation, CheckCircle, Loader } from 'lucide-react';

const VisitLogging = () => {
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [notes, setNotes] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const getGPSLocation = () => {
        setLoading(true);
        setError('');
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                
                // Optional: Reverse geocoding could be done here
                try {
                    // Simulating check-in
                    const res = await axios.post(`${API_URL}/visits/check-in`, {
                        lat: latitude,
                        lng: longitude,
                        address: `GPS: ${latitude}, ${longitude}`,
                        notes: notes
                    }, {
                        headers: { 'x-auth-token': localStorage.getItem('token') }
                    });
                    setSuccess(true);
                    setNotes('');
                } catch (err) {
                    setError('Failed to log visit. Please try again.');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError('Unable to retrieve your location. Please enable GPS.');
                setLoading(false);
            }
        );
    };

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Visit Logging</h2>
                <p style={{ color: 'var(--text-muted)' }}>Securely log your field visits with verified GPS location.</p>
            </header>

            <div className="card" style={{ maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        background: success ? 'var(--success)' : 'var(--primary-light)', 
                        color: success ? 'white' : 'var(--primary)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem',
                        transition: 'var(--transition)'
                    }}>
                        {loading ? <Loader size={40} className="animate-spin" /> : <MapPin size={40} />}
                    </div>
                    
                    <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
                        {success ? 'Visit Logged Successfully!' : 'Ready to Check-in?'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        {success ? 'Your location and timestamp have been recorded.' : 'Click the button below to capture your current GPS coordinates.'}
                    </p>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

                    {!success ? (
                        <>
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label className="form-label">Visit Notes (Optional)</label>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Briefly describe the purpose of this visit..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="3"
                                ></textarea>
                            </div>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                                onClick={getGPSLocation}
                                disabled={loading}
                            >
                                <Navigation size={20} /> {loading ? 'Capturing Location...' : 'Punch In My Visit'}
                            </button>
                        </>
                    ) : (
                        <button 
                            className="btn btn-outline" 
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => { setSuccess(false); setLocation(null); }}
                        >
                            Log Another Visit
                        </button>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div className="card">
                    <h4 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} color="var(--success)" /> Why GPS Tracking?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        To ensure transparency and accurate payroll, ETS uses manual GPS check-ins. We only capture your location when you click the button. No background tracking is performed.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VisitLogging;
