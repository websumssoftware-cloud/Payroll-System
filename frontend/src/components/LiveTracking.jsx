import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { MapPin, Navigation, User, AlertTriangle, Clock } from 'lucide-react';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { API_URL } from '../config';

const MapController = ({ selectedEmployee }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedEmployee) {
            const lastPos = selectedEmployee.history.length > 0 
                ? selectedEmployee.history[selectedEmployee.history.length - 1].location 
                : selectedEmployee.visit.location;
            map.flyTo([lastPos.lat, lastPos.lng], 16, {
                duration: 1.5
            });
        }
    }, [selectedEmployee, map]);
    return null;
};

const LiveTracking = () => {
    const [liveData, setLiveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const fetchLiveLocations = async () => {
        try {
            const res = await axios.get(`${API_URL}/visits/live`);
            const sortedData = (res.data || []).sort((a, b) => {
                const timeA = a.history.length > 0 ? new Date(a.history[a.history.length-1].timestamp) : new Date(a.visit.timestamp);
                const timeB = b.history.length > 0 ? new Date(b.history[b.history.length-1].timestamp) : new Date(b.visit.timestamp);
                return timeB - timeA;
            });
            setLiveData(sortedData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching live locations:', err);
        }
    };

    useEffect(() => {
        fetchLiveLocations();
        const interval = setInterval(fetchLiveLocations, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const createCustomIcon = (name, color) => {
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="
                        background: ${color}; 
                        width: 35px; 
                        height: 35px; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        color: white; 
                        font-weight: 800; 
                        border: 3px solid white; 
                        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                    ">
                        ${name.charAt(0)}
                    </div>
                    <div style="
                        background: white;
                        color: #1e293b;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 11px;
                        font-weight: 700;
                        margin-top: 4px;
                        border: 1px solid ${color};
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        ${name}
                    </div>
                </div>
            `,
            iconSize: [100, 60], // Increased size to accommodate name
            iconAnchor: [50, 30]
        });
    };

    if (loading) return <div className="loading-state">Loading Live Map...</div>;

    return (
        <div className="tab-view animate-fade">


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', height: '600px' }}>
                <div className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                    <MapContainer 
                        center={[18.5204, 73.8567]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            attribution='&copy; Google Maps'
                        />
                        <MapController selectedEmployee={selectedEmployee} />
                        {liveData.map((data, idx) => {
                            const lastPos = data.history.length > 0 
                                ? data.history[data.history.length - 1].location 
                                : data.visit.location;
                            
                            const path = [
                                [data.visit.location.lat, data.visit.location.lng],
                                ...data.history.map(h => [h.location.lat, h.location.lng])
                            ];

                            const isOutOfRange = data.history.some(h => h.notes?.includes('OUT OF RANGE'));

                            return (
                                <React.Fragment key={idx}>
                                    {/* 1km Range Circle */}
                                    <Circle 
                                        center={[data.visit.location.lat, data.visit.location.lng]}
                                        radius={1000}
                                        pathOptions={{ 
                                            color: isOutOfRange ? '#ef4444' : '#3b82f6', 
                                            fillColor: isOutOfRange ? '#ef4444' : '#3b82f6', 
                                            fillOpacity: 0.1 
                                        }}
                                    />
                                    
                                    {/* Movement Path */}
                                    <Polyline 
                                        positions={path} 
                                        pathOptions={{ color: '#2563EB', weight: 3, dashArray: '5, 10' }} 
                                    />

                                    {/* Current Position Marker */}
                                    <Marker 
                                        position={[lastPos.lat, lastPos.lng]}
                                        icon={createCustomIcon(data.employee.name, isOutOfRange ? '#ef4444' : '#2563EB')}
                                    >
                                        <Popup>
                                            <div style={{ padding: '5px' }}>
                                                <h4 style={{ margin: '0 0 5px 0' }}>{data.employee.name}</h4>
                                                <p style={{ margin: '0', fontSize: '12px' }}>{data.visit.clientName}</p>
                                                <p style={{ margin: '5px 0', fontSize: '10px', color: '#64748b' }}>
                                                    Last updated: {new Date(data.history[data.history.length-1]?.timestamp || data.visit.timestamp).toLocaleTimeString()}
                                                </p>
                                                {isOutOfRange && (
                                                    <div style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertTriangle size={14} /> OUT OF RANGE
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>

                                    {/* Start Point Marker */}
                                    <Marker position={[data.visit.location.lat, data.visit.location.lng]}>
                                        <Popup>Visit Start: {data.visit.clientName}</Popup>
                                    </Marker>
                                </React.Fragment>
                            );
                        })}
                    </MapContainer>
                </div>

                <div className="card" style={{ padding: '20px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '15px', fontWeight: '700' }}>Active Employees</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {liveData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                <User size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                                <p>No active field staff right now.</p>
                            </div>
                        ) : liveData.map((data, idx) => {
                            const isOutOfRange = data.history.some(h => h.notes?.includes('OUT OF RANGE'));
                            return (
                                <div 
                                    key={idx} 
                                    className={`tracking-list-item ${isOutOfRange ? 'range-violation' : ''} ${selectedEmployee?.employee?._id === data.employee?._id ? 'active-selection' : ''}`}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '16px',
                                        background: selectedEmployee?.employee?._id === data.employee?._id ? '#eff6ff' : '#f8fafc',
                                        border: `1px solid ${selectedEmployee?.employee?._id === data.employee?._id ? '#3b82f6' : (isOutOfRange ? '#fee2e2' : '#e2e8f0')}`,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedEmployee(data)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            borderRadius: '12px', 
                                            background: isOutOfRange ? '#fee2e2' : '#eff6ff',
                                            color: isOutOfRange ? '#ef4444' : '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '800'
                                        }}>
                                            {data.employee.name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{data.employee.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{data.visit.clientName}</div>
                                        </div>
                                        {isOutOfRange && <AlertTriangle size={18} color="#ef4444" />}
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(data.visit.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span style={{ color: isOutOfRange ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                                            {isOutOfRange ? 'OUT OF RANGE' : 'IN RANGE'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;
