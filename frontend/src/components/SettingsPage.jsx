import React, { useState } from 'react';
import { Users, ChevronDown, Bell, User, Clock, Settings, Shield, Laptop, FileText, ToggleLeft, Check } from 'lucide-react';
import OvertimeModal from './OvertimeModal';

const SettingsPage = () => {
  const [isOTModalOpen, setIsOTModalOpen] = useState(false);

  return (
    <div>
      <OvertimeModal isOpen={isOTModalOpen} onClose={() => setIsOTModalOpen(false)} />
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c5ba9' }}>WebSum Payroll</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           <Bell size={20} />
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} /></div>
              <span>Narayan</span>
              <ChevronDown size={14} />
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Settings Sidebar */}
        <div style={{ width: '250px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
           <div style={{ padding: '20px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Settings</div>
           <div className="settings-menu">
              <div style={{ padding: '15px 20px', background: '#f0f7ff', color: '#2c5ba9', fontWeight: '500', cursor: 'pointer' }}>Shifts & Time Management</div>
              <div style={{ padding: '15px 20px', color: '#666', cursor: 'pointer' }}>Attendance Management</div>
              <div style={{ padding: '15px 20px', color: '#666', cursor: 'pointer' }}>Hardware Management</div>
              <div style={{ padding: '15px 20px', color: '#666', cursor: 'pointer' }}>Employee Management</div>
              <div 
                style={{ padding: '15px 20px', color: '#666', cursor: 'pointer' }}
                onClick={() => setIsOTModalOpen(true)}
              >
                Payroll Management (Overtime)
              </div>
              <div style={{ padding: '15px 20px', color: '#666', cursor: 'pointer' }}>Configurations</div>
           </div>
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '30px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                 <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', color: '#666' }}>Contact *</label>
                    <input type="text" defaultValue="07969223344" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }} />
                 </div>
                 <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', color: '#666' }}>Website / Email</label>
                    <input type="text" defaultValue="www.petpooja.com" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }} />
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '14px' }}>Auto Release Payslip</span>
                    <div style={{ width: 40, height: 20, background: '#007bff', borderRadius: '10px', position: 'relative' }}>
                       <div style={{ width: 16, height: 16, background: 'white', borderRadius: '50%', position: 'absolute', right: 2, top: 2 }}></div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>Branch Wise Payslip</span>
                    <div style={{ width: 40, height: 20, background: '#007bff', borderRadius: '10px', position: 'relative' }}>
                       <div style={{ width: 16, height: 16, background: 'white', borderRadius: '50%', position: 'absolute', right: 2, top: 2 }}></div>
                    </div>
                 </div>
              </div>

              <div>
                 <table className="mini-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ background: '#f8f9fa' }}>
                          <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#666' }}>Earnings</th>
                          <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#666' }}>Amount (Rs.)</th>
                          <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#666' }}>Deductions</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr>
                          <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Total Gross Earnings</td>
                          <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>0.00</td>
                          <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Total Deductions</td>
                       </tr>
                    </tbody>
                 </table>

                 <div style={{ marginTop: '30px', border: '1px solid #eee', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                       <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>Total Payable Days</div>
                       </div>
                       <div style={{ flex: 2 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                             <span style={{ color: '#666' }}>Worked Day</span>
                             <span style={{ fontWeight: 'bold' }}>: 0</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                             <span style={{ color: '#666' }}>Holiday</span>
                             <span style={{ fontWeight: 'bold' }}>: 0</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                             <span style={{ color: '#666' }}>Paid Leaves</span>
                             <span style={{ fontWeight: 'bold' }}>: 0</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                             <span style={{ color: '#666' }}>Weekly Off</span>
                             <span style={{ fontWeight: 'bold' }}>: 0</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div style={{ marginTop: '20px', background: '#e9f7ef', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>Total Net Payable : ₹ </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total Net Payable = Gross Earnings - Total Deductions</div>
                 </div>
              </div>
           </div>
           
           <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold' }}>Save</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
