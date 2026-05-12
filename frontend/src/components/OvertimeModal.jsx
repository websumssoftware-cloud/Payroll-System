import React from 'react';
import { X, Clock } from 'lucide-react';

const OvertimeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', width: '500px', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Overtime Pay Settings</h3>
          <X onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>
        
        <div style={{ padding: '25px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '15px' }}>Overtime Method</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="ot" /> No Overtime
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="ot" defaultChecked /> Fixed Per Hour Pay
               </label>
               <input type="text" defaultValue="100" style={{ marginLeft: '25px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }} />
               <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="radio" name="ot" /> Multiplier of Hourly Wage
               </label>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>Buffer Period</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
              <Clock size={16} color="#666" style={{ marginRight: '8px' }} />
              <input type="text" defaultValue="00:10" style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Define when overtime begins post-shift</p>
          </div>

          <div>
             <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '15px' }}>Overtime Period</label>
             <div style={{ display: 'flex', gap: '10px' }}>
                {['01 Min', '15 Min', '30 Min', '45 Min', '60 Min'].map((p) => (
                  <div key={p} style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', background: p === '60 Min' ? '#e9f7ef' : 'white', borderColor: p === '60 Min' ? '#28a745' : '#ddd', color: p === '60 Min' ? '#28a745' : '#333' }}>
                    {p}
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div style={{ padding: '20px', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold' }}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default OvertimeModal;
