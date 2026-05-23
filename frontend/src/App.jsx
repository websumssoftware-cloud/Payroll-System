import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, MapPin, CalendarCheck, CreditCard, Settings, 
  Bell, Search, Plus, ArrowUpRight, ArrowDownRight, Clock, MoreVertical,
  LogOut, LogIn, Sprout, CheckCircle2, XCircle, AlertCircle, AlertTriangle, FileText, 
  ExternalLink, ChevronRight, Filter, Download, UserPlus, Eye, Mail, Phone, Calendar,
  FileClock, FileCheck, UserCheck, ClipboardList, MapPinned, Edit2, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';
import axios from 'axios';
import Swal from 'sweetalert2';
import './App.css';
import LiveTracking from './components/LiveTracking';
import logo from './assets/kusum_cow_logo.jpg';

import { API_URL, BASE_URL } from './config';

const KusumAdmin = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [visits, setVisits] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view' or 'edit'
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [attendanceView, setAttendanceView] = useState('Daily'); // 'Daily' or 'Weekly'
  const [employeeFilterDate, setEmployeeFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [employeeFilterView, setEmployeeFilterView] = useState('Weekly');
  const [visitFilterDate, setVisitFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [visitFilterView, setVisitFilterView] = useState('Daily');
  const [visitCityFilter, setVisitCityFilter] = useState('');
  const [leaveFilterDate, setLeaveFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [leaveFilterView, setLeaveFilterView] = useState('Weekly');
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth());
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollSearchTerm, setPayrollSearchTerm] = useState('');
  const [showPunchLogs, setShowPunchLogs] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchAllData();
    const dataInterval = setInterval(fetchAllData, 30000); // Poll every 30s
    return () => {
      clearInterval(timer);
      clearInterval(dataInterval);
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, visitRes, leaveRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/attendance`),
        axios.get(`${API_URL}/visits`),
        axios.get(`${API_URL}/leaves`),
        axios.get(`${API_URL}/notifications/all`) // New endpoint for admin to see all
      ]);
      setEmployees(empRes.data || []);
      setAttendance((attRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
      setVisits((visitRes.data || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      setLeaves((leaveRes.data || []).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate)));
      setNotifications((notifRes.data || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/leaves/${id}`, { status: newStatus });
      setLeaves(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));
      alert(`Leave ${newStatus} successfully!`);
    } catch (err) {
      console.error("Error updating leave:", err);
    }
  };

  const deleteEmployee = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this employee?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id !== id));
      Swal.fire('Deleted!', 'Employee has been deleted.', 'success');
    } catch (err) {
      console.error("Error deleting employee:", err);
      Swal.fire("Error", "Failed to delete employee", "error");
    }
  };

  const handleSaveEmployee = async () => {
    try {
      const payload = {
        name: selectedEmp.name || '',
        email: selectedEmp.email || '',
        phone: selectedEmp.phone || '',
        salary: Number(selectedEmp.salary) || 0,
        designation: selectedEmp.designation || selectedEmp.role || 'Employee',
        role: 'Employee'
      };
      
      if (modalType === 'add') {
        payload.password = "Kusum@123";
        payload.employeeId = "EMP" + Math.floor(1000 + Math.random() * 9000);
        await axios.post(`${API_URL}/employees`, payload);
        Swal.fire({ title: 'Success!', text: 'Employee Added Successfully!', icon: 'success', confirmButtonColor: '#10b981' });
      } else {
        await axios.put(`${API_URL}/employees/${selectedEmp._id}`, payload);
        Swal.fire({ title: 'Saved!', text: 'Changes saved successfully!', icon: 'success', confirmButtonColor: '#10b981' });
      }
      
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Error saving employee:", err);
      let errorMsg = 'Failed to save employee';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
           errorMsg = `Server Error: ${err.response.status}`;
        } else {
           errorMsg = err.response.data.message || JSON.stringify(err.response.data);
        }
      } else {
        errorMsg = err.message || 'Network Error';
      }
      Swal.fire({ title: 'Error', text: errorMsg, icon: 'error', confirmButtonColor: '#10b981' });
    }
  };

  const handleDownload = (data, type) => {
    const slipWindow = window.open('', '_blank');
    let contentHtml = '';
    let title = '';

    if (type === 'Salary Slip') {
      title = `Salary Slip - ${data.name}`;
      const daysInMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0).getDate();
      const empAttendance = attendance.filter(a => (a.employee?._id === data._id || a.employee === data._id) && a.status === 'Checked In').length;
      contentHtml = `
        <div class="header">
          <img src="${logo}" alt="Kusum Farm" style="height: 70px; object-fit: contain; margin-bottom: 12px; border-radius: 50%; padding: 4px; border: 2px solid #10b981;" />
          <h1>Kusum Farm</h1>
          <p>Salary Slip • ${currentTime.toLocaleString('default', { month: 'long' })} ${currentTime.getFullYear()}</p>
        </div>
        <div class="meta-grid">
          <div class="meta-item"><b>Name</b><span>${data.name}</span></div>
          <div class="meta-item"><b>Designation</b><span>${data.designation || 'Field Staff'}</span></div>
          <div class="meta-item"><b>Employee ID</b><span>#EMP${data._id.slice(-5).toUpperCase()}</span></div>
          <div class="meta-item"><b>Attendance</b><span>${empAttendance}/${daysInMonth} Days</span></div>
        </div>
        <table class="salary-table">
          <thead><tr><th>Earnings</th><th>Amount</th><th>Deductions</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Basic Salary</td><td>₹${data.salary.toLocaleString()}</td><td>Professional Tax</td><td>₹200</td></tr>
            <tr><td>HRA</td><td>₹${(data.salary * 0.1).toLocaleString()}</td><td>Other</td><td>₹0</td></tr>
            <tr class="total-row"><td>Gross Earnings</td><td>₹${(data.salary * 1.1).toLocaleString()}</td><td>Total Deductions</td><td>₹200</td></tr>
          </tbody>
        </table>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
          <p style="margin: 0; color: #166534; font-weight: 700; font-size: 20px;">Net Payable: ₹${(data.salary * 1.1 - 200).toLocaleString()}</p>
        </div>
      `;
    } else if (type === 'Monthly Attendance') {
      title = 'Monthly Attendance Report';
      contentHtml = `
        <div class="header">
          <img src="${logo}" alt="Kusum Farm" style="height: 70px; object-fit: contain; margin-bottom: 12px; border-radius: 50%; padding: 4px; border: 2px solid #10b981;" />
          <h1>Kusum Farm</h1>
          <p>Monthly Attendance Report • ${currentTime.toLocaleString('default', { month: 'long' })} ${currentTime.getFullYear()}</p>
        </div>
        <table class="salary-table">
          <thead><tr><th>Employee Name</th><th>Employee ID</th><th>Present Days</th><th>Status</th></tr></thead>
          <tbody>
            ${employees.map(emp => `
              <tr>
                <td>${emp.name}</td>
                <td>#EMP${emp._id.slice(-5).toUpperCase()}</td>
                <td>${attendance.filter(a => (a.employee?._id === emp._id || a.employee === emp._id)).length}</td>
                <td style="color: #10b981; font-weight: 600;">ACTIVE</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'Salary Sheet') {
      title = 'Company Salary Sheet';
      const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
      contentHtml = `
        <div class="header">
          <img src="${logo}" alt="Kusum Farm" style="height: 70px; object-fit: contain; margin-bottom: 12px; border-radius: 50%; padding: 4px; border: 2px solid #10b981;" />
          <h1>Kusum Farm</h1>
          <p>Consolidated Salary Sheet • ${currentTime.toLocaleString('default', { month: 'long' })} ${currentTime.getFullYear()}</p>
        </div>
        <table class="salary-table">
          <thead><tr><th>Employee Name</th><th>Base Salary</th><th>Allowances</th><th>Net Pay</th></tr></thead>
          <tbody>
            ${employees.map(emp => `
              <tr>
                <td>${emp.name}</td>
                <td>₹${emp.salary.toLocaleString()}</td>
                <td>₹${(emp.salary * 0.1).toLocaleString()}</td>
                <td>₹${(emp.salary * 1.1).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row"><td>Total Company Payout</td><td>---</td><td>---</td><td>₹${(totalSalary * 1.1).toLocaleString()}</td></tr>
          </tbody>
        </table>
      `;
    } else if (type === 'Visit Summary') {
      title = 'Field Visit Summary';
      contentHtml = `
        <div class="header">
          <img src="${logo}" alt="Kusum Farm" style="height: 70px; object-fit: contain; margin-bottom: 12px; border-radius: 50%; padding: 4px; border: 2px solid #10b981;" />
          <h1>Kusum Farm</h1>
          <p>Field Visit Log • Today's Activity</p>
        </div>
        <table class="salary-table">
          <thead><tr><th>Employee</th><th>Time</th><th>Location Address</th></tr></thead>
          <tbody>
            ${visits.map(v => `
              <tr>
                <td>${v.employeeId?.name || 'Staff'}</td>
                <td>${new Date(v.timestamp).toLocaleTimeString()}</td>
                <td>${v.location?.address || 'Site Visit'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'Audit Trail') {
      title = `Audit Trail - ${data.employee?.name}`;
      contentHtml = `
        <div class="header">
          <img src="${logo}" alt="Kusum Farm" style="height: 70px; object-fit: contain; margin-bottom: 12px; border-radius: 50%; padding: 4px; border: 2px solid #10b981;" />
          <h1>Kusum Farm</h1>
          <p>Attendance Audit Trail • ${data.date}</p>
        </div>
        <div class="meta-grid" style="margin-bottom: 20px;">
          <div class="meta-item"><b>Employee Name</b><span>${data.employee?.name || 'Staff'}</span></div>
          <div class="meta-item"><b>Total Duration</b><span>${data.totalWorkingHours || 'N/A'}</span></div>
        </div>
        <table class="salary-table">
          <thead><tr><th>Action</th><th>Time</th><th>Location / Coordinates</th></tr></thead>
          <tbody>
            ${(data.punches || []).map(p => `
              <tr>
                <td style="color: ${p.type === 'In' ? '#059669' : '#e11d48'}; font-weight: bold;">PUNCH ${p.type.toUpperCase()}</td>
                <td>${p.time}</td>
                <td>${p.location?.address || p.location || 'Location Not Recorded'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #3b82f6; margin: 0; font-size: 28px; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
            .meta-item b { color: #64748b; font-size: 12px; text-transform: uppercase; display: block; }
            .meta-item span { font-size: 16px; font-weight: 600; }
            .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .salary-table th { text-align: left; background: #f1f5f9; padding: 12px; border: 1px solid #e2e8f0; }
            .salary-table td { padding: 12px; border: 1px solid #e2e8f0; }
            .total-row { background: #3b82f6; color: white; font-weight: bold; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #94a3b8; width: 200px; text-align: center; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Print / Save as PDF</button>
          </div>
          <div class="report-content">${contentHtml}</div>
          <div class="footer"><div class="signature">Authorized Signatory</div><div class="signature">Employee Signature</div></div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
        </body>
      </html>
    `;
    slipWindow.document.write(html);
    slipWindow.document.close();
  };

  // Render Functions for each Tab
  const renderOverview = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const empWeekly = employees.filter(e => new Date(e.createdAt) >= lastWeek).length;
    const empMonthly = employees.filter(e => new Date(e.createdAt) >= lastMonth).length;

    const visitsWeekly = visits.filter(v => new Date(v.timestamp) >= lastWeek).length;
    const visitsMonthly = visits.filter(v => new Date(v.timestamp) >= lastMonth).length;

    const chartData = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-CA');
      const count = attendance.filter(a => a.date === dateStr && (a.status === 'Checked In' || a.status === 'Late')).length;
      return {
        name: d.toLocaleDateString([], { weekday: 'short' }),
        present: count
      };
    });

    const stats = [
      { 
        title: 'Total Employees', 
        value: employees.length, 
        icon: <Users size={20} />, 
        color: '#3B82F6', 
        bg: '#EFF6FF',
        trends: []
      },
      { 
        title: 'Currently In', 
        value: attendance.filter(a => (a.status === 'Checked In' || a.status === 'Late') && a.date === currentTime.toLocaleDateString('en-CA')).length, 
        icon: <UserCheck size={20} />, 
        color: '#10B981', 
        bg: '#ECFDF5',
        trends: [
          { label: 'Live Status', color: '#10B981' },
          { label: `${attendance.filter(a => (a.status === 'Checked In' || a.status === 'Late') && a.date === new Date(Date.now() - 86400000).toLocaleDateString('en-CA')).length} yesterday`, color: '#64748b' }
        ]
      },
      { 
        title: 'Pending Leaves', 
        value: leaves.filter(l => l.status === 'Pending').length, 
        icon: <ClipboardList size={20} />, 
        color: '#F59E0B', 
        bg: '#FFFBEB',
        trends: [
          { label: 'Action Needed', color: '#F59E0B' },
          { label: `${leaves.filter(l => l.status === 'Pending' && new Date(l.createdAt) < new Date().setHours(0,0,0,0)).length} carried over`, color: '#64748b' }
        ]
      },
      { 
        title: 'Field Visits', 
        value: visits.filter(v => new Date(v.timestamp).toLocaleDateString('en-CA') === currentTime.toLocaleDateString('en-CA')).length, 
        icon: <MapPinned size={20} />, 
        color: '#8B5CF6', 
        bg: '#F5F3FF',
        trends: []
      },
    ];

    return (
      <div className="tab-view animate-fade">
        <div className="stats-grid-modern">
          {stats.map((s, i) => (
            <div key={i} className="stat-card-horizontal">
              <div className="stat-icon-wrapper" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-content">
                <span className="stat-label-modern">{s.title}</span>
                <div className="stat-value-wrap">
                  <h3 className="stat-value-modern">{s.value < 10 ? `0${s.value}` : s.value}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {s.trends.map((t, idx) => (
                      <span key={idx} className="stat-trend-chip" style={{ color: t.color, backgroundColor: `${t.color}15`, fontSize: '0.65rem' }}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="grid-card main-feed">
          <div className="card-header">
            <div>
              <h3>Live Attendance Feed</h3>
              <p className="card-subtitle">Real-time tracking of employee presence</p>
            </div>
            <button className="view-all-btn" onClick={() => setActiveTab('Attendance')}>View Full Logs <ChevronRight size={14} /></button>
          </div>
          <div className="table-responsive">
            <table className="modern-table compact">
              <thead><tr><th>Employee</th><th>Time</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {employees
                  .filter(emp => attendance.some(a => 
                    (a.employee?._id === emp._id || a.employee === emp._id) && 
                    a.date === currentTime.toLocaleDateString('en-CA')
                  ))
                  .slice(0, 6).map((emp, i) => {
                  const record = attendance.find(a => 
                    (a.employee?._id === emp._id || a.employee === emp._id) && 
                    a.date === currentTime.toLocaleDateString('en-CA')
                  );
                  const leave = leaves.find(l => (l.employeeId?._id === emp._id || l.employeeId === emp._id) && l.status === 'Approved');
                  const inPunch = record?.punches?.find(p => p.type === 'In');
                  
                  let status = 'ABSENT';
                  let statusClass = 'absent';
                  if (record) {
                    status = 'PRESENT';
                    statusClass = 'present';
                  } else if (leave) {
                    status = 'ON LEAVE';
                    statusClass = 'leave';
                  }

                  return (
                    <tr key={i}>
                      <td>
                        <div className="user-info-s">
                          <div className="u-avatar-s" style={{ backgroundColor: statusClass === 'present' ? '#10B981' : '#CBD5E1' }}>{emp.name.charAt(0)}</div>
                          <div>
                            <div className="u-name-s">{emp.name}</div>
                            <div className="u-role-s">{emp.designation || 'Staff'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="t-time-s">{inPunch?.timestamp ? new Date(inPunch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : inPunch?.time || '--:--'}</td>
                      <td className="t-loc-s">{inPunch?.location?.address || '---'}</td>
                      <td><span className={`status-tag ${statusClass}`}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            </div>

          <div className="grid-card" style={{ padding: '2rem' }}>
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Attendance Trends</h3>
                <p className="card-subtitle">Daily presence breakdown for the last 7 days</p>
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="present" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPresent)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid-card side-feed">
          <div className="card-header">
            <h3>Leave Requests</h3>
            <span className="notif-badge">{leaves.filter(l => l.status === 'Pending').length}</span>
          </div>
          <div className="activity-list">
            {leaves.filter(l => l.status === 'Pending').length > 0 ? leaves.filter(l => l.status === 'Pending').slice(0, 4).map((l, i) => (
              <div key={i} className="activity-item-premium">
                <div className="activity-icon"><CalendarCheck size={16} /></div>
                <div className="activity-details">
                  <div className="activity-top">
                    <span className="activity-user">{l.employeeId?.name || 'Staff'}</span>
                    <span className="activity-time">{l.leaveType}</span>
                  </div>
                  <p className="activity-desc">{l.reason}</p>
                  <div className="activity-actions">
                    <button className="act-btn approve" onClick={() => handleLeaveAction(l._id, 'Approved')}>
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button className="act-btn reject" onClick={() => handleLeaveAction(l._id, 'Rejected')}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state-s">
                <CheckCircle2 size={32} color="#10B981" />
                <p>All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


  const renderEmployees = () => {
    const getWeekRange = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const weekRange = getWeekRange(employeeFilterDate);

    const filteredEmployees = employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="tab-view animate-fade">
        <div className="attendance-filter-bar">
          <div className="view-toggle">
            <button className={employeeFilterView === 'Daily' ? 'active' : ''} onClick={() => setEmployeeFilterView('Daily')}>Daily</button>
            <button className={employeeFilterView === 'Weekly' ? 'active' : ''} onClick={() => setEmployeeFilterView('Weekly')}>Weekly</button>
          </div>
          <div className="date-nav">
            <button className="nav-btn" onClick={() => {
              const d = new Date(employeeFilterDate);
              d.setDate(d.getDate() - (employeeFilterView === 'Daily' ? 1 : 7));
              setEmployeeFilterDate(d.toISOString().split('T')[0]);
            }}><ChevronRight style={{transform: 'rotate(180deg)'}} size={18} /></button>
            <div className="current-range">
              <Calendar size={16} />
              <span>{employeeFilterView === 'Daily' ? new Date(employeeFilterDate).toDateString() : `${new Date(weekRange.start).toLocaleDateString()} - ${new Date(weekRange.end).toLocaleDateString()}`}</span>
            </div>
            <button className="nav-btn" onClick={() => {
              const d = new Date(employeeFilterDate);
              d.setDate(d.getDate() + (employeeFilterView === 'Daily' ? 1 : 7));
              setEmployeeFilterDate(d.toISOString().split('T')[0]);
            }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ flex: 1 }} />
          <div className="search-box-large" style={{ width: '300px', flex: 'none' }}>
            <Search size={18} />
            <input 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="premium-add-btn" onClick={() => { setSelectedEmp({ name: '', role: '', email: '', phone: '', salary: '' }); setModalType('add'); setShowModal(true); }}>
            <UserPlus size={18} /> Add New Employee
          </button>
        </div>

        <div className="grid-card full-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => (
                  <tr key={e._id}>
                    <td style={{ fontWeight: '700', color: '#1e293b' }}>
                      {e.employeeId || 'EMP' + String(e._id).slice(-3).toUpperCase()}
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="u-avatar" style={{ backgroundColor: '#10b981' }}>{e.name?.charAt(0)}</div>
                        <div className="u-name" style={{ fontWeight: '600' }}>{e.name}</div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{e.designation || 'Field Executive'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                          <Phone size={14} /> {e.phone || '+91 98765 43210'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                          <Mail size={14} /> {e.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>₹{e.salary?.toLocaleString() || '25,000'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="view-btn" onClick={() => { setSelectedEmp(e); setModalType('view'); setShowModal(true); }}><Eye size={16} /></button>
                        <button className="edit-btn" onClick={() => { setSelectedEmp(e); setModalType('edit'); setShowModal(true); }}><Edit2 size={16} /></button>
                        <button className="del-btn" onClick={() => deleteEmployee(e._id)}><Trash2 size={16} /></button>
                      </div>
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

  const renderAttendance = () => {
    const getWeekRange = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const weekRange = getWeekRange(attendanceDate);

    const filteredAttendance = attendance.filter(a => {
      if (attendanceView === 'Daily') {
        return a.date === attendanceDate;
      } else {
        return a.date >= weekRange.start && a.date <= weekRange.end;
      }
    });

    const displayLogs = attendanceView === 'Daily' 
      ? employees
          .filter(emp => filteredAttendance.some(a => (a.employee?._id === emp._id || a.employee === emp._id)))
          .map(emp => {
          const record = filteredAttendance.find(a => (a.employee?._id === emp._id || a.employee === emp._id));
          return { emp, record, date: attendanceDate };
        })
      : filteredAttendance.map(a => ({ emp: a.employee, record: a, date: a.date }));

    return (
      <div className="tab-view animate-fade">
        <div className="attendance-filter-bar">
          <div className="view-toggle">
            <button className={attendanceView === 'Daily' ? 'active' : ''} onClick={() => setAttendanceView('Daily')}>Daily</button>
            <button className={attendanceView === 'Weekly' ? 'active' : ''} onClick={() => setAttendanceView('Weekly')}>Weekly</button>
          </div>
          <div className="date-nav">
            <button className="nav-btn" onClick={() => {
              const d = new Date(attendanceDate);
              d.setDate(d.getDate() - (attendanceView === 'Daily' ? 1 : 7));
              setAttendanceDate(d.toISOString().split('T')[0]);
            }}><ChevronRight style={{transform: 'rotate(180deg)'}} size={18} /></button>
            <div className="current-range">
              <Calendar size={16} />
              <span>{attendanceView === 'Daily' ? new Date(attendanceDate).toDateString() : `${new Date(weekRange.start).toLocaleDateString()} - ${new Date(weekRange.end).toLocaleDateString()}`}</span>
            </div>
            <button className="nav-btn" onClick={() => {
              const d = new Date(attendanceDate);
              d.setDate(d.getDate() + (attendanceView === 'Daily' ? 1 : 7));
              setAttendanceDate(d.toISOString().split('T')[0]);
            }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ flex: 1 }} />
          <div className="quick-date-picker">
             <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>
        </div>

        <div className="stats-grid-modern">
          {[
            { 
              title: 'Present Today', 
              value: filteredAttendance.filter(a => a.status === 'Checked In' || a.status === 'Late').length, 
              trend: attendanceView === 'Daily' ? `${((filteredAttendance.filter(a => a.status === 'Checked In' || a.status === 'Late').length / (employees.length || 1)) * 100).toFixed(0)}% Rate` : 'Total Present', 
              icon: <CheckCircle2 size={20} />, color: '#10B981', bg: '#ECFDF5' 
            },
            { 
              title: 'Late Arrivals', 
              value: filteredAttendance.filter(a => a.status === 'Late').length, 
              trend: 'Check Logs', icon: <Clock size={20} />, color: '#F59E0B', bg: '#FFFBEB' 
            },
            { 
              title: 'Absent / Leave', 
              value: attendanceView === 'Daily' ? Math.max(0, employees.length - filteredAttendance.filter(a => a.status === 'Checked In' || a.status === 'Late').length) : filteredAttendance.filter(a => a.status === 'Absent').length, 
              trend: 'Records', icon: <XCircle size={20} />, color: '#EF4444', bg: '#FEF2F2' 
            },
          ].map((s, i) => (
            <div key={i} className="stat-card-horizontal">
              <div className="stat-icon-wrapper" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-content">
                <span className="stat-label-modern">{s.title}</span>
                <div className="stat-value-wrap">
                  <h3 className="stat-value-modern">{s.value < 10 ? `0${s.value}` : s.value}</h3>
                  <span className="stat-trend-chip" style={{ color: s.color, backgroundColor: `${s.color}15` }}>{s.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid-card full-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Employee</th><th>Date</th><th>First In</th><th>Last Out</th><th>Work Hours</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {displayLogs.map((item, i) => {
                  const { emp, record, date } = item;
                  if (!emp) return null;
                  
                  const leave = leaves.find(l => (l.employeeId?._id === emp._id || l.employeeId === emp._id) && l.status === 'Approved' && date >= l.fromDate.split('T')[0] && date <= l.toDate.split('T')[0]);
                  const inPunch = record?.punches?.find(p => p.type === 'In');
                  const outPunches = record?.punches?.filter(p => p.type === 'Out');
                  const outPunch = outPunches?.length > 0 ? outPunches[outPunches.length - 1] : null;
  
                  let status = 'ABSENT';
                  let statusClass = 'late';
                  if (record) {
                    status = 'PRESENT';
                    statusClass = 'in';
                  } else if (leave) {
                    status = 'ON LEAVE';
                    statusClass = 'pending';
                  }
  
                  return (
                    <tr key={i}>
                      <td>
                        <div className="user-info">
                          <div className="u-avatar">{emp.name?.charAt(0)}</div>
                          <div className="u-name">{emp.name}</div>
                        </div>
                      </td>
                      <td style={{fontWeight: '600', color: '#64748B'}}>{date}</td>
                      <td className="t-time">{inPunch?.timestamp ? new Date(inPunch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : inPunch?.time || '---'}</td>
                      <td className="t-time">{outPunch?.timestamp ? new Date(outPunch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : outPunch?.time || '---'}</td>
                      <td style={{fontWeight: '700', color: 'var(--primary)'}}>{record?.totalWorkingHours || '00h 00m'}</td>
                      <td><span className={`status-pill ${statusClass}`}>{status}</span></td>
                      <td>
                        {record && (
                          <button 
                            style={{ 
                              padding: '6px 14px', 
                              fontSize: '12px', 
                              fontWeight: '700', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              color: '#2563EB', 
                              border: '1px solid #BFDBFE', 
                              background: '#EFF6FF', 
                              borderRadius: '8px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(37,99,235,0.05)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#DBEAFE'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                            onClick={() => { setSelectedAttendance(record); setShowPunchLogs(true); }}
                          >
                            <FileClock size={14} /> Logs
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderVisits = () => {
    const getWeekRange = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const weekRange = getWeekRange(visitFilterDate);

    const filteredVisits = visits.filter(v => {
      const vDate = new Date(v.timestamp).toISOString().split('T')[0];
      const matchesDate = visitFilterView === 'Daily' ? vDate === visitFilterDate : (vDate >= weekRange.start && vDate <= weekRange.end);
      const matchesCity = visitCityFilter ? (v.cityName || '').toLowerCase().includes(visitCityFilter.toLowerCase()) : true;
      return matchesDate && matchesCity;
    });

    return (
      <div className="tab-view animate-fade">
        <div className="attendance-filter-bar" style={{ marginBottom: '32px' }}>
          <div className="view-toggle">
            <button className={visitFilterView === 'Daily' ? 'active' : ''} onClick={() => setVisitFilterView('Daily')}>Daily</button>
            <button className={visitFilterView === 'Weekly' ? 'active' : ''} onClick={() => setVisitFilterView('Weekly')}>Weekly</button>
          </div>
          <div className="date-nav">
            <button className="nav-btn" onClick={() => {
              const d = new Date(visitFilterDate);
              d.setDate(d.getDate() - (visitFilterView === 'Daily' ? 1 : 7));
              setVisitFilterDate(d.toISOString().split('T')[0]);
            }}><ChevronRight style={{transform: 'rotate(180deg)'}} size={18} /></button>
            <div className="current-range">
              <Calendar size={16} />
              <span>{visitFilterView === 'Daily' ? new Date(visitFilterDate).toDateString() : `${new Date(weekRange.start).toLocaleDateString()} - ${new Date(weekRange.end).toLocaleDateString()}`}</span>
            </div>
            <button className="nav-btn" onClick={() => {
              const d = new Date(visitFilterDate);
              d.setDate(d.getDate() + (visitFilterView === 'Daily' ? 1 : 7));
              setVisitFilterDate(d.toISOString().split('T')[0]);
            }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ flex: 1 }} />
          <div className="city-filter" style={{ position: 'relative', marginRight: '12px' }}>
            <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Search by city..." 
              value={visitCityFilter} 
              onChange={(e) => setVisitCityFilter(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.9rem', width: '200px', backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: '500', transition: 'all 0.2s' }}
            />
          </div>
          <div className="quick-date-picker">
             <input type="date" value={visitFilterDate} onChange={(e) => setVisitFilterDate(e.target.value)} />
          </div>
        </div>

        <div className="visit-grid">
          {filteredVisits.length > 0 ? filteredVisits.map((v) => (
            <div key={v._id} className="visit-card-premium">
              <div className="visit-img-wrap">
                <img 
                  src={v.imageUrl ? (v.imageUrl.startsWith('/uploads') ? `${BASE_URL}${v.imageUrl}` : v.imageUrl) : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600'} 
                  alt="Field" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600';
                    e.target.onerror = null;
                  }}
                />
                <div className="visit-time-tag"><Clock size={10} /> {new Date(v.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="visit-body">
                <div className="visit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <h4 className="v-client-name" style={{ lineHeight: '1.2', margin: 0, fontSize: '1.15rem', color: '#0F172A', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.clientName}</h4>
                    {v.cityName && (
                      <div style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <MapPin size={12} /> {v.cityName}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '6px' }}>
                    <div className="v-status-live" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}><div className="dot-live" /> Live Map</div>
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <p className="v-purpose-text" style={{ fontSize: '0.85rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4', margin: 0, fontWeight: '500' }}>{v.purpose}</p>
                </div>

                <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}>
                      {v.employeeId?.name?.charAt(0) || 'E'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Assigned Executive</div>
                      <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.95rem' }}>{v.employeeId?.name || 'Staff Member'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button 
                      onClick={() => setSelectedVisit(v)}
                      style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps?q=${v.location?.lat},${v.location?.lng}`, '_blank')}
                      style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '10px', border: 'none', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
                    >
                      <MapPin size={14} /> Open GPS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="grid-card full-card" style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <MapPin size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>No site visits recorded for this period.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLeaves = () => {
    const getWeekRange = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const weekRange = getWeekRange(leaveFilterDate);

    const filteredLeaves = leaves.filter(l => {
      const lDate = l.fromDate.split('T')[0];
      if (leaveFilterView === 'Daily') return lDate === leaveFilterDate;
      return lDate >= weekRange.start && lDate <= weekRange.end;
    });

    return (
      <div className="tab-view animate-fade">
        <div className="attendance-filter-bar" style={{ marginBottom: '32px' }}>
          <div className="view-toggle">
            <button className={leaveFilterView === 'Daily' ? 'active' : ''} onClick={() => setLeaveFilterView('Daily')}>Daily</button>
            <button className={leaveFilterView === 'Weekly' ? 'active' : ''} onClick={() => setLeaveFilterView('Weekly')}>Weekly</button>
          </div>
          <div className="date-nav">
            <button className="nav-btn" onClick={() => {
              const d = new Date(leaveFilterDate);
              d.setDate(d.getDate() - (leaveFilterView === 'Daily' ? 1 : 7));
              setLeaveFilterDate(d.toISOString().split('T')[0]);
            }}><ChevronRight style={{transform: 'rotate(180deg)'}} size={18} /></button>
            <div className="current-range">
              <Calendar size={16} />
              <span>{leaveFilterView === 'Daily' ? new Date(leaveFilterDate).toDateString() : `${new Date(weekRange.start).toLocaleDateString()} - ${new Date(weekRange.end).toLocaleDateString()}`}</span>
            </div>
            <button className="nav-btn" onClick={() => {
              const d = new Date(leaveFilterDate);
              d.setDate(d.getDate() + (leaveFilterView === 'Daily' ? 1 : 7));
              setLeaveFilterDate(d.toISOString().split('T')[0]);
            }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ flex: 1 }} />
          <div className="quick-date-picker">
             <input type="date" value={leaveFilterDate} onChange={(e) => setLeaveFilterDate(e.target.value)} />
          </div>
        </div>

        <div className="stats-grid-modern">
          {[
            { 
              title: 'Pending Requests', 
              value: filteredLeaves.filter(l => l.status === 'Pending').length, 
              trend: 'Action Needed', icon: <FileClock size={20} />, color: '#F59E0B', bg: '#FFFBEB' 
            },
            { 
              title: 'Approved Leaves', 
              value: filteredLeaves.filter(l => l.status === 'Approved').length, 
              trend: 'Total History', icon: <FileCheck size={20} />, color: '#10B981', bg: '#ECFDF5' 
            },
          ].map((s, i) => (
            <div key={i} className="stat-card-horizontal">
              <div className="stat-icon-wrapper" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-content">
                <span className="stat-label-modern">{s.title}</span>
                <div className="stat-value-wrap">
                  <h3 className="stat-value-modern">{s.value < 10 ? `0${s.value}` : s.value}</h3>
                  <span className="stat-trend-chip" style={{ color: s.color, backgroundColor: `${s.color}15` }}>{s.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid-card full-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Employee</th><th>Leave Type</th><th>Reason</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredLeaves.length > 0 ? filteredLeaves.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-info">
                        <div className="u-avatar">{l.employeeId?.name?.charAt(0) || 'L'}</div>
                        <div className="u-name">{l.employeeId?.name || 'Staff'}</div>
                      </div>
                    </td>
                    <td><span className="role-chip">{l.leaveType || 'General'}</span></td>
                    <td className="t-loc">{l.reason}</td>
                    <td className="t-time">
                      {new Date(l.fromDate).toLocaleDateString()} - {new Date(l.toDate).toLocaleDateString()}
                    </td>
                    <td><span className={`status-pill ${l.status === 'Approved' ? 'in' : l.status === 'Rejected' ? 'out' : 'late'}`}>{l.status.toUpperCase()}</span></td>
                    <td>
                      {l.status === 'Pending' && (
                        <div className="action-btns">
                          <button className="btn-approve" onClick={() => handleLeaveAction(l._id, 'Approved')}>
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button className="btn-reject" onClick={() => handleLeaveAction(l._id, 'Rejected')}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                      <Calendar size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <p>No leave requests found for this period.</p>
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

  const renderReports = () => (
    <div className="tab-view animate-fade">
      <div className="stats-grid-modern">
        {[
          { 
            title: 'Avg. Attendance', 
            value: `${((attendance.filter(a => a.status === 'Checked In' || a.status === 'Late').length / (employees.length || 1)) * 100).toFixed(0)}%`, 
            trend: 'Current Month', icon: <UserCheck size={20} />, color: '#10B981', bg: '#ECFDF5' 
          },
          { 
            title: 'Total Site Visits', 
            value: visits.length, 
            trend: 'Monthly Progress', icon: <MapPin size={20} />, color: '#8B5CF6', bg: '#F5F3FF' 
          },
          { 
            title: 'Pending Approvals', 
            value: leaves.filter(l => l.status === 'Pending').length, 
            trend: 'Action Required', icon: <ClipboardList size={20} />, color: '#F59E0B', bg: '#FFFBEB' 
          },
        ].map((s, i) => (
          <div key={i} className="stat-card-horizontal">
            <div className="stat-icon-wrapper" style={{ backgroundColor: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-content">
              <span className="stat-label-modern">{s.title}</span>
              <div className="stat-value-wrap">
                <h3 className="stat-value-modern">{s.value}</h3>
                <span className="stat-trend-chip" style={{ color: s.color, backgroundColor: `${s.color}15` }}>{s.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-card">
        <div className="card-header"><h3>Download Official Reports</h3></div>
        <div className="report-download-grid">
          <div className="download-box">
            <div className="dl-icon"><FileText size={24} /></div>
            <div className="dl-info"><h4>Monthly Attendance</h4><p>Detailed PDF report with timestamps</p></div>
            <button className="dl-btn" onClick={() => handleDownload(null, 'Monthly Attendance')}><Download size={16} /> Export PDF</button>
          </div>
          <div className="download-box">
            <div className="dl-icon"><CreditCard size={24} /></div>
            <div className="dl-info"><h4>Salary Sheet</h4><p>Complete payroll breakdown (CSV)</p></div>
            <button className="dl-btn" onClick={() => handleDownload(null, 'Salary Sheet')}><Download size={16} /> Export PDF</button>
          </div>
          <div className="download-box">
            <div className="dl-icon"><MapPin size={24} /></div>
            <div className="dl-info"><h4>Site Visit Summary</h4><p>Location log with image proofs</p></div>
            <button className="dl-btn" onClick={() => handleDownload(null, 'Visit Summary')}><Download size={16} /> Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayroll = () => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const daysInMonth = new Date(payrollYear, payrollMonth + 1, 0).getDate();
    const hasRecords = attendance.some(a => new Date(a.date).getMonth() === payrollMonth && new Date(a.date).getFullYear() === payrollYear);

    const payrollData = employees.map(e => {
      const empAttendance = attendance.filter(a => {
        const aDate = new Date(a.date);
        return (a.employee?._id === e._id || a.employee === e._id) && 
               (a.status === 'Checked In' || a.status === 'Late') && 
               aDate.getMonth() === payrollMonth && 
               aDate.getFullYear() === payrollYear;
      }).length;

      let approvedLeaveDays = 0;
      leaves.forEach(l => {
        if ((l.employeeId?._id === e._id || l.employeeId === e._id) && l.status === 'Approved') {
          const from = new Date(l.fromDate);
          const to = new Date(l.toDate);
          if (from.getMonth() === payrollMonth && from.getFullYear() === payrollYear) {
            const diffTime = Math.abs(to - from);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            approvedLeaveDays += diffDays;
          }
        }
      });

      const dailyWage = (e.salary || 0) / daysInMonth;
      const totalPresentAndLeave = empAttendance + approvedLeaveDays;
      const missingDays = Math.max(0, daysInMonth - totalPresentAndLeave);
      const deductions = hasRecords ? Math.round(missingDays * dailyWage) : 0;
      const netPay = Math.max(0, (e.salary || 0) - deductions);

      return {
        ...e,
        empAttendance,
        approvedLeaveDays,
        deductions,
        netPay
      };
    });

    const actualTotalPayroll = payrollData.reduce((sum, e) => sum + e.netPay, 0);
    
    return (
      <div className="tab-view animate-fade">
        <div className="attendance-filter-bar" style={{ marginBottom: '32px' }}>
          <div className="date-nav">
            <button className="nav-btn" onClick={() => {
              if (payrollMonth === 0) {
                setPayrollMonth(11);
                setPayrollYear(prev => prev - 1);
              } else {
                setPayrollMonth(prev => prev - 1);
              }
            }}><ChevronRight style={{transform: 'rotate(180deg)'}} size={18} /></button>
            <div className="current-range" style={{ minWidth: '150px' }}>
              <Calendar size={16} />
              <span>{months[payrollMonth]} {payrollYear}</span>
            </div>
            <button className="nav-btn" onClick={() => {
              if (payrollMonth === 11) {
                setPayrollMonth(0);
                setPayrollYear(prev => prev + 1);
              } else {
                setPayrollMonth(prev => prev + 1);
              }
            }}><ChevronRight size={18} /></button>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search employee by name..." 
                value={payrollSearchTerm}
                onChange={(e) => setPayrollSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%', border: '1px solid var(--border)', borderRadius: '10px' }}
              />
            </div>
          </div>
          <div className="quick-date-picker" style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={payrollMonth} 
              onChange={(e) => setPayrollMonth(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontWeight: '600' }}
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={payrollYear} 
              onChange={(e) => setPayrollYear(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontWeight: '600' }}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>


        <div className="payroll-summary-grid">
          <div className="payroll-card total"><h5>Total Payroll</h5><h3>₹ {actualTotalPayroll.toLocaleString()}</h3><p>For {months[payrollMonth]} {payrollYear}</p></div>
          <div className="payroll-card disbursed"><h5>Disbursed</h5><h3>₹ {(Math.round(actualTotalPayroll * 0.7)).toLocaleString()}</h3><div className="progress-bar"><div className="progress" style={{width: '70%'}} /></div></div>
          <div className="payroll-card pending"><h5>Pending</h5><h3>₹ {(Math.round(actualTotalPayroll * 0.3)).toLocaleString()}</h3><p>Settlement in progress</p></div>
        </div>
        <div className="grid-card full-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Employee</th><th>Attendance</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {payrollData.filter(e => e.name.toLowerCase().includes(payrollSearchTerm.toLowerCase())).map((e) => {
                  return (
                    <tr key={e._id}>
                      <td>
                        <div className="user-info">
                          <div className="u-avatar">{e.name.charAt(0)}</div>
                          <div className="u-name">{e.name}</div>
                        </div>
                      </td>
                      <td>{e.empAttendance}/{daysInMonth} Days</td>
                      <td>₹{e.deductions.toLocaleString()} (Leaves)</td>
                      <td className="salary-text">₹{e.netPay.toLocaleString()}</td>
                      <td><span className={`pay-status ${e.deductions > 0 ? 'late' : 'paid'}`}>{e.deductions > 0 ? 'Adjusted' : 'Paid'}</span></td>
                      <td><button className="download-slip-btn" onClick={() => handleDownload(e, 'Salary Slip')}><Download size={14} /> Slip</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-logo-premium">
            <img src={logo} alt="Kusum Farm Logo" className="sidebar-logo-img" />
          </div>
          <div className="brand-info">
            <h1 className="brand-name">KUSUM FARM</h1>
            <p className="brand-tag">Admin Portal</p>
          </div>
        </div>
        <nav className="side-nav">
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { id: 'Employees', icon: <Users size={18} /> },
            { id: 'Attendance', icon: <Clock size={18} /> },
            { id: 'Live Tracking', icon: <MapPinned size={18} /> },
            { id: 'Site Visits', icon: <MapPin size={18} /> },
            { id: 'Leaves', icon: <CalendarCheck size={18} /> },
            { id: 'Payroll', icon: <CreditCard size={18} /> },
            { id: 'Reports', icon: <FileText size={18} /> },
          ].map((item) => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon}<span>{item.id}</span>{activeTab === item.id && <div className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-profile-box"><div className="admin-avatar">AD</div><div className="admin-meta"><span className="admin-name">Super Admin</span><span className="admin-role">System Manager</span></div></div>
          <button className="logout-btn" onClick={onLogout}><LogOut size={18} /> <span>Logout</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="search-bar"><Search size={18} color="#94A3B8" /><input type="text" placeholder="Search employees, locations..." /></div>
          <div className="header-actions">
            <div className="time-display"><Clock size={16} /><span>{currentTime.toLocaleTimeString()}</span></div>
            <div className="notification-wrapper">
              <button className={`icon-btn notification ${showNotifications ? 'active' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <div className="badge">{notifications.filter(n => !n.isRead).length}</div>
                )}
              </button>
              
              {showNotifications && (
                <div className="notif-dropdown animate-fade">
                  <div className="notif-header">
                    <h4>Recent Alerts</h4>
                    <span onClick={() => setShowNotifications(false)}>Close</span>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notif">No new alerts</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''} ${n.type === 'Range Alert' ? 'alert' : ''}`}>
                          <div className="notif-icon">
                            {n.type === 'Range Alert' ? <AlertTriangle size={14} /> : <Bell size={14} />}
                          </div>
                          <div className="notif-content">
                            <p className="notif-title">{n.title}</p>
                            <p className="notif-msg">{n.message}</p>
                            <span className="notif-time">{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="add-btn" onClick={() => { setSelectedEmp({ name: '', role: '', email: '', phone: '', salary: '' }); setModalType('add'); setShowModal(true); }}>
              <Plus size={18} /> <span>Quick Action</span>
            </button>
          </div>
        </header>

        <div className="content-body">
          <div className="welcome-banner">
            <div className="banner-text"><h2>{activeTab} Management</h2><p>Overview and details of Kusum Farm {activeTab.toLowerCase()}.</p></div>
            <div className="date-chip">{currentTime.toDateString()}</div>
          </div>

          {activeTab === 'Dashboard' && renderOverview()}
          {activeTab === 'Employees' && renderEmployees()}
          {activeTab === 'Attendance' && renderAttendance()}
          {activeTab === 'Live Tracking' && <LiveTracking />}
          {activeTab === 'Site Visits' && renderVisits()}
          {activeTab === 'Leaves' && renderLeaves()}
          {activeTab === 'Payroll' && renderPayroll()}
          {activeTab === 'Reports' && renderReports()}
        </div>

        {/* Dynamic Modal */}
        {showModal && selectedEmp && (
          <div className="modal-overlay animate-fade">
            <div className="modal-content premium-modal">
              <div className="modal-header-premium">
                <h3 className="modal-title-green">{modalType === 'view' ? 'Employee Details' : modalType === 'edit' ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button className="close-btn-ghost" onClick={() => setShowModal(false)}><XCircle size={24} /></button>
              </div>
              <div className="modal-body-premium">
                {modalType !== 'add' && (
                  <div className="profile-header-card">
                    <div className="profile-avatar-box">
                      {selectedEmp.profileImage ? (
                        <img src={selectedEmp.profileImage.startsWith('http') ? selectedEmp.profileImage : `${BASE_URL}${selectedEmp.profileImage}`} alt="profile" className="profile-img-large" />
                      ) : (
                        <div className="profile-initials-large">{selectedEmp.name ? selectedEmp.name.charAt(0) : 'E'}</div>
                      )}
                    </div>
                    <div className="profile-meta-box">
                      <h4 className="profile-name-main">{selectedEmp.name || 'New Hire'}</h4>
                      <p className="profile-role-sub">{selectedEmp.designation || selectedEmp.role || 'Employee'}</p>
                    </div>
                  </div>
                )}
                
                <div className="premium-fields-grid">
                  <div className="premium-field full-width">
                    <label>Full Name</label>
                    <div className="premium-input-box">
                      <input readOnly={modalType === 'view'} value={selectedEmp?.name || ''} onChange={e => setSelectedEmp({...selectedEmp, name: e.target.value})} placeholder="Rahul Singh" />
                    </div>
                  </div>
                  <div className="premium-field">
                    <label>Email Address</label>
                    <div className="premium-input-box">
                      <input readOnly={modalType === 'view'} value={selectedEmp?.email || ''} onChange={e => setSelectedEmp({...selectedEmp, email: e.target.value})} placeholder="rahul@kusum.com" />
                    </div>
                  </div>
                  <div className="premium-field">
                    <label>Phone Number</label>
                    <div className="premium-input-box">
                      <input readOnly={modalType === 'view'} value={selectedEmp?.phone || ''} onChange={e => { const val = e.target.value.replace(/\D/g, ''); if(val.length <= 10) setSelectedEmp({...selectedEmp, phone: val}); }} maxLength={10} placeholder="9876543203" />
                    </div>
                  </div>
                  <div className="premium-field">
                    <label>Base Salary (₹)</label>
                    <div className="premium-input-box">
                      <input type="number" readOnly={modalType === 'view'} value={selectedEmp?.salary || ''} onChange={e => setSelectedEmp({...selectedEmp, salary: e.target.value})} placeholder="35000" />
                    </div>
                  </div>
                  <div className="premium-field">
                    <label>Work Role</label>
                    <div className="premium-input-box">
                      <input readOnly={modalType === 'view'} value={selectedEmp?.designation || selectedEmp?.role || ''} onChange={e => setSelectedEmp({...selectedEmp, designation: e.target.value})} placeholder="Employee" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer-premium" style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', padding: '20px 30px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px' }}>
                <button 
                  style={{
                    padding: '10px 20px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                {modalType !== 'view' && (
                  <button 
                    style={{
                      padding: '10px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)', transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)'; }}
                    onClick={handleSaveEmployee}
                  >
                    {modalType === 'add' ? 'Create Employee' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {selectedVisit && (
          <div className="modal-overlay animate-fade">
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%', padding: '0', maxHeight: '90vh', overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={selectedVisit.imageUrl ? (selectedVisit.imageUrl.startsWith('/uploads') ? `${BASE_URL}${selectedVisit.imageUrl}` : selectedVisit.imageUrl) : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600'} 
                  alt="Field" 
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600'; e.target.onerror = null; }}
                />
                <button className="close-btn-ghost" onClick={() => setSelectedVisit(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <XCircle size={24} color="#0F172A" />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', margin: 0, lineHeight: '1.2' }}>{selectedVisit.clientName}</h3>
                    <span style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF', padding: '4px 10px', borderRadius: '16px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)', flexShrink: 0 }}>
                      Completed
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: '0.8rem', fontWeight: '600' }}>
                    <Clock size={14} color="#94A3B8" style={{ marginRight: '6px' }} /> 
                    <span>{new Date(selectedVisit.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span style={{ margin: '0 8px', color: '#CBD5E1' }}>•</span>
                    <span>{new Date(selectedVisit.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #F1F5F9' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Visit Details</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: '500' }}>Purpose of Visit</label>
                      <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '0.9rem' }}>{selectedVisit.purpose || 'N/A'}</span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: '500' }}>City Name</label>
                      <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '0.9rem' }}>{selectedVisit.cityName || 'N/A'}</span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: '500' }}>Farmer Contact</label>
                      <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '0.9rem' }}>{selectedVisit.farmerContact || 'N/A'}</span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: '500' }}>Farmer DOB</label>
                      <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '0.9rem' }}>{selectedVisit.farmerDOB || 'N/A'}</span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: '500' }}>Monthly Sell Volume</label>
                      <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '0.9rem' }}>{selectedVisit.monthlySellVolume ? `${selectedVisit.monthlySellVolume}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
                      {selectedVisit.employeeId?.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Assigned Executive</div>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '1.05rem' }}>{selectedVisit.employeeId?.name || 'Staff Member'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                       {selectedVisit.employeeId?.designation || 'Field Duty'}
                     </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Punch Logs Audit Modal */}
        {showPunchLogs && selectedAttendance && (
          <div className="modal-overlay animate-fade">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header-premium" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title-green">Attendance Audit Trail</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleDownload(selectedAttendance, 'Audit Trail')}><Download size={16} /> PDF</button>
                  <button className="close-btn-ghost" onClick={() => setShowPunchLogs(false)}><XCircle size={24} /></button>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {selectedAttendance.employee?.name?.[0] || 'E'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{selectedAttendance.employee?.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date: {selectedAttendance.date}</p>
                  </div>
                </div>
              </div>
              
              <div className="activity-timeline" style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px 10px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '23px', top: '20px', bottom: '20px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                
                {(selectedAttendance.punches || []).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '20px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', 
                      background: p.type === 'In' ? '#10b981' : '#ef4444', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      flexShrink: 0, marginTop: '10px'
                    }}>
                      {p.type === 'In' ? <LogIn size={12} color="white" /> : <LogOut size={12} color="white" />}
                    </div>
                    
                    <div style={{ 
                      flex: 1, background: 'white', border: '1px solid #e2e8f0', 
                      borderRadius: '12px', padding: '15px', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute', left: '-6px', top: '18px', width: '10px', height: '10px',
                        background: 'white', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
                        transform: 'rotate(45deg)'
                      }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                            background: p.type === 'In' ? '#ecfdf5' : '#fff1f2',
                            color: p.type === 'In' ? '#059669' : '#e11d48'
                          }}>
                            Punch {p.type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                          <Clock size={14} /> {p.time}
                        </div>
                      </div>
                      
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: '1.4' }}>
                        <MapPin size={14} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} /> 
                        {p.location?.lat && p.location?.lng ? (
                          <a 
                            href={`https://www.google.com/maps?q=${p.location.lat},${p.location.lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#2563EB', textDecoration: 'none', fontWeight: '600' }}
                          >
                            {p.location?.address || 'View Location on Google Maps'}
                          </a>
                        ) : (
                          <span>{typeof p.location === 'string' ? p.location : (p.location?.address || 'Site Location Recorded')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--primary-soft)', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-dark)' }}>Total Working Duration: {selectedAttendance.totalWorkingHours}</span>
              </div>
            </div>
          </div>
        )}
        </main>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-logo">
            <img src={logo} alt="Kusum Farm" className="login-logo-img" />
          </div>
          <h2>Kusum Farm</h2>
          <p>Sign in to your account</p>
        </div>
        {error && <div className="login-error"><AlertCircle size={16} /> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@kusum.com" required />
            </div>
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Settings size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    setToken(newToken);
    axios.defaults.headers.common['x-auth-token'] = newToken;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['x-auth-token'];
    setToken(null);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const interceptor = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response && error.response.status === 401) {
            alert('Session expired. Please sign in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['x-auth-token'];
            setToken(null);
          }
          return Promise.reject(error);
        }
      );
      
      return () => {
        axios.interceptors.response.eject(interceptor);
      };
    }
  }, [token]);

  return (
    <div className="app-root">
      {!token ? <Login onLogin={handleLogin} /> : <KusumAdmin onLogout={handleLogout} />}
    </div>
  );
};

export default App;
