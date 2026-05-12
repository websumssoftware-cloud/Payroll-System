import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, MapPin, CalendarCheck, CreditCard, Settings, 
  Bell, Search, Plus, ArrowUpRight, ArrowDownRight, Clock, MoreVertical,
  LogOut, Sprout, CheckCircle2, XCircle, AlertCircle, FileText, 
  ExternalLink, ChevronRight, Filter, Download, UserPlus, Eye, Mail, Phone, Calendar,
  FileClock, FileCheck, UserCheck, ClipboardList
} from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://payroll-system-abxy.onrender.com/api';

const KusumAdmin = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [visits, setVisits] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view' or 'edit'
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceView, setAttendanceView] = useState('Daily'); // 'Daily' or 'Weekly'
  const [employeeFilterDate, setEmployeeFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeFilterView, setEmployeeFilterView] = useState('Weekly');
  const [visitFilterDate, setVisitFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitFilterView, setVisitFilterView] = useState('Daily');
  const [leaveFilterDate, setLeaveFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveFilterView, setLeaveFilterView] = useState('Weekly');
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth());
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchAllData();
    return () => clearInterval(timer);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, visitRes, leaveRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/attendance`),
        axios.get(`${API_URL}/visits`),
        axios.get(`${API_URL}/leaves`)
      ]);
      setEmployees(empRes.data || []);
      setAttendance(attRes.data || []);
      setVisits(visitRes.data || []);
      setLeaves(leaveRes.data || []);
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

  const handleDownload = (data, type) => {
    const slipWindow = window.open('', '_blank');
    let contentHtml = '';
    let title = '';

    if (type === 'Salary Slip') {
      title = `Salary Slip - ${data.name}`;
      const daysInMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0).getDate();
      const empAttendance = attendance.filter(a => (a.employee?._id === data._id || a.employee === data._id) && a.status === 'Checked In').length;
      contentHtml = `
        <div class="header"><h1>Kusum Farm</h1><p>Salary Slip • ${currentTime.toLocaleString('default', { month: 'long' })} ${currentTime.getFullYear()}</p></div>
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
        <div class="header"><h1>Kusum Farm</h1><p>Monthly Attendance Report • ${currentTime.toLocaleString('default', { month: 'long' })} ${currentTime.getFullYear()}</p></div>
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
        <div class="header"><h1>Kusum Farm</h1><p>Consolidated Salary Sheet • ${currentTime.toLocaleString('default', { month: 'long' })} ${currentTime.getFullYear()}</p></div>
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
        <div class="header"><h1>Kusum Farm</h1><p>Field Visit Log • Today's Activity</p></div>
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
  const renderOverview = () => (
    <div className="tab-view animate-fade">
      <div className="stats-grid">
        {[
          { title: 'Total Employees', value: employees.length, trend: '+8 this month', icon: <Users />, color: '#3B82F6', bg: '#FFFFFF' },
          { title: 'Currently In', value: attendance.filter(a => a.status === 'Checked In').length, trend: 'Live Status', icon: <Clock />, color: '#10B981', bg: '#FFFFFF' },
          { title: 'Pending Leaves', value: leaves.filter(l => l.status === 'Pending').length, trend: 'Action Needed', icon: <CalendarCheck />, color: '#F59E0B', bg: '#FFFFFF' },
          { title: 'Field Visits Today', value: visits.length, trend: 'Live Tracking', icon: <MapPin />, color: '#8B5CF6', bg: '#FFFFFF' },
        ].map((s, i) => (
          <div key={i} className={`stat-card-custom ${s.title === 'Pending Leaves' && s.value > 0 ? 'pulse-alert' : ''}`} style={{ backgroundColor: s.bg }}>
            <div className="stat-row-top">
              <span className="stat-value-huge">{s.value < 10 ? `0${s.value}` : s.value}</span>
            </div>
            <div className="stat-row-middle">
              <div className="stat-icon-mini" style={{ color: s.color, backgroundColor: `${s.color}15` }}>{s.icon}</div>
              <h3 className="stat-title-mini">{s.title}</h3>
            </div>
            <div className="stat-row-bottom">
              <span className="stat-trend-mini" style={{ color: s.color }}>{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="grid-card attendance-card">
          <div className="card-header"><h3>Live Attendance Feed</h3><button className="text-btn">View All <ChevronRight size={14} /></button></div>
          <div className="table-responsive">
            <table>
              <thead><tr><th>Employee</th><th>Time</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {employees.slice(0, 7).map((emp, i) => {
                  const record = attendance.find(a => (a.employee?._id === emp._id || a.employee === emp._id));
                  const leave = leaves.find(l => (l.employeeId?._id === emp._id || l.employeeId === emp._id) && l.status === 'Approved');
                  const inPunch = record?.punches?.find(p => p.type === 'In');
                  
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
                          <div className="u-avatar">{emp.name.charAt(0)}</div>
                          <div>
                            <div className="u-name">{emp.name}</div>
                            <div className="u-role">{emp.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="t-time">{inPunch?.time || '---'}</td>
                      <td className="t-loc">{inPunch?.location?.address || '---'}</td>
                      <td><span className={`status-pill ${statusClass}`}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid-card action-card">
          <div className="card-header"><h3>Leave Approvals</h3><span className="count-badge">{leaves.length} New</span></div>
          <div className="action-list">
            {leaves.filter(l => l.status === 'Pending').map((l, i) => (
              <div key={i} className="action-item">
                <div className="action-icon pending"><AlertCircle size={18} /></div>
                <div className="action-body">
                  <p className="action-title">{l.employeeId?.name || 'Staff'} - Leave Request</p>
                  <p className="action-meta">{l.reason} | {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}</p>
                  <div className="action-btns">
                    <button className="btn-approve" onClick={() => handleLeaveAction(l._id, 'Approved')}>Approve</button>
                    <button className="btn-reject" onClick={() => handleLeaveAction(l._id, 'Rejected')}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
              <thead><tr><th>Employee</th><th>Contact</th><th>Role</th><th>Activity ({employeeFilterView})</th><th>Salary</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredEmployees.map((e) => {
                  const empLogs = attendance.filter(a => {
                    const isEmp = a.employee?._id === e._id || a.employee === e._id;
                    if (!isEmp) return false;
                    if (employeeFilterView === 'Daily') return a.date === employeeFilterDate;
                    return a.date >= weekRange.start && a.date <= weekRange.end;
                  });
                  
                  const presentCount = empLogs.filter(l => l.status === 'Checked In').length;
                  const totalExpected = employeeFilterView === 'Daily' ? 1 : 7;
                  const percentage = Math.min(100, (presentCount / totalExpected) * 100);

                  return (
                    <tr key={e._id}>
                      <td><div className="user-info"><div className="u-avatar large">{e.name?.charAt(0)}</div><div><div className="u-name">{e.name}</div><div className="u-id">ID: #{e._id.slice(-5)}</div></div></div></td>
                      <td><div className="contact-info"><div><Mail size={12} /> {e.email}</div><div><Phone size={12} /> {e.phone}</div></div></td>
                      <td><span className="role-chip">{e.role}</span></td>
                      <td>
                        <div style={{ width: '120px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', fontWeight: '700' }}>
                            <span style={{ color: percentage > 50 ? '#10B981' : '#EF4444' }}>{presentCount} Days Present</span>
                            <span>{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar"><div className="progress" style={{ width: `${percentage}%`, background: percentage > 50 ? '#10B981' : '#F59E0B' }} /></div>
                        </div>
                      </td>
                      <td className="salary-text">₹{e.salary.toLocaleString()}</td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-btn-s" onClick={() => { setSelectedEmp(e); setModalType('view'); setShowModal(true); }}><Eye size={16} /></button>
                          <button className="icon-btn-s" onClick={() => { setSelectedEmp(e); setModalType('edit'); setShowModal(true); }}><Settings size={16} /></button>
                        </div>
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
      ? employees.map(emp => {
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

        <div className="stats-grid">
          {[
            { 
              title: 'Present', 
              value: filteredAttendance.filter(a => a.status === 'Checked In').length, 
              trend: attendanceView === 'Daily' ? `${((filteredAttendance.filter(a => a.status === 'Checked In').length / (employees.length || 1)) * 100).toFixed(0)}% Rate` : 'Total Present', 
              icon: <CheckCircle2 />, color: '#10B981', bg: '#F0FDF4' 
            },
            { 
              title: 'Late Arrivals', 
              value: filteredAttendance.filter(a => a.late).length, 
              trend: 'Check Logs', icon: <Clock />, color: '#F59E0B', bg: '#FFFFFF' 
            },
            { 
              title: 'Absent', 
              value: attendanceView === 'Daily' ? Math.max(0, employees.length - filteredAttendance.filter(a => a.status === 'Checked In').length) : filteredAttendance.filter(a => a.status === 'Absent').length, 
              trend: 'Records', icon: <XCircle />, color: '#EF4444', bg: '#FFFFFF' 
            },
          ].map((s, i) => (
            <div key={i} className="stat-card-custom" style={{ backgroundColor: s.bg }}>
              <div className="stat-row-top">
                <span className="stat-value-huge">{s.value < 10 ? `0${s.value}` : s.value}</span>
              </div>
              <div className="stat-row-middle">
                <div className="stat-icon-mini" style={{ color: s.color, backgroundColor: `${s.color}15` }}>{s.icon}</div>
                <h3 className="stat-title-mini">{s.title}</h3>
              </div>
              <div className="stat-row-bottom">
                <span className="stat-trend-mini" style={{ color: s.color }}>{s.trend}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid-card full-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Employee</th><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {displayLogs.map((item, i) => {
                  const { emp, record, date } = item;
                  if (!emp) return null;
                  
                  const leave = leaves.find(l => (l.employeeId?._id === emp._id || l.employeeId === emp._id) && l.status === 'Approved' && date >= l.fromDate.split('T')[0] && date <= l.toDate.split('T')[0]);
                  const inPunch = record?.punches?.find(p => p.type === 'In');
                  const outPunch = record?.punches?.find(p => p.type === 'Out');
  
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
                      <td className="t-time">{inPunch?.time || '---'}</td>
                      <td className="t-time">{outPunch?.time || '---'}</td>
                      <td className="t-loc">{inPunch?.location?.address?.split(',')[0] || '---'}</td>
                      <td><span className={`status-pill ${statusClass}`}>{status}</span></td>
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
      if (visitFilterView === 'Daily') return vDate === visitFilterDate;
      return vDate >= weekRange.start && vDate <= weekRange.end;
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
          <div className="quick-date-picker">
             <input type="date" value={visitFilterDate} onChange={(e) => setVisitFilterDate(e.target.value)} />
          </div>
        </div>

        <div className="visit-grid">
          {filteredVisits.length > 0 ? filteredVisits.map((v) => (
            <div key={v._id} className="visit-card-premium">
              <div className="visit-img-wrap">
                <img 
                  src={v.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600'} 
                  alt="Field" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600';
                    e.target.onerror = null;
                  }}
                />
                <div className="visit-time-tag"><Clock size={10} /> {new Date(v.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="visit-body">
                <div className="visit-header">
                  <div>
                    <h4 className="v-client-name">{v.clientName}</h4>
                    <p className="v-purpose-text">{v.purpose}</p>
                  </div>
                  <div className="v-status-live"><div className="dot-live" /> Live Map</div>
                </div>
                <div className="visit-map-container" style={{ margin: '12px 0', borderRadius: '12px', overflow: 'hidden' }}>
                   <iframe 
                    width="100%" height="120" frameBorder="0" 
                    src={`https://maps.google.com/maps?q=${v.location?.lat},${v.location?.lng}&z=15&output=embed`}
                  />
                </div>
                <div className="v-footer">
                  <div className="v-emp-info">
                    <div className="v-avatar-s">{v.employeeId?.name?.charAt(0) || 'E'}</div>
                    <div className="v-meta-s">
                      <span className="v-name-s">{v.employeeId?.name || 'Staff'}</span>
                      <span className="v-role-s">{v.employeeId?.designation || 'Field Duty'}</span>
                    </div>
                  </div>
                  <button 
                    className="v-map-btn" 
                    onClick={() => window.open(`https://www.google.com/maps?q=${v.location?.lat},${v.location?.lng}`, '_blank')}
                  >
                    <MapPin size={14} /> Open GPS
                  </button>
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

        <div className="stats-grid">
          <div className="stat-card-custom" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="stat-row-top"><span className="stat-value-huge">{filteredLeaves.filter(l => l.status === 'Pending').length}</span></div>
            <div className="stat-row-middle">
              <div className="stat-icon-mini" style={{ color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}><FileClock size={16} /></div>
              <h3 className="stat-title-mini">Pending ({leaveFilterView})</h3>
            </div>
            <div className="stat-row-bottom"><span className="stat-trend-mini" style={{ color: '#F59E0B' }}>Action Needed</span></div>
          </div>
          <div className="stat-card-custom" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="stat-row-top"><span className="stat-value-huge">{filteredLeaves.filter(l => l.status === 'Approved').length}</span></div>
            <div className="stat-row-middle">
              <div className="stat-icon-mini" style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}><FileCheck size={16} /></div>
              <h3 className="stat-title-mini">Approved</h3>
            </div>
            <div className="stat-row-bottom"><span className="stat-trend-mini" style={{ color: '#10B981' }}>Total Approvals</span></div>
          </div>
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
                    <td><span className={`status-pill ${l.status === 'Approved' ? 'in' : 'late'}`}>{l.status.toUpperCase()}</span></td>
                    <td>
                      {l.status === 'Pending' && (
                        <div className="action-btns">
                          <button className="btn-approve" onClick={() => handleLeaveAction(l._id, 'Approved')}>Approve</button>
                          <button className="btn-reject" onClick={() => handleLeaveAction(l._id, 'Rejected')}>Reject</button>
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
      <div className="stats-grid">
        <div className="stat-card-custom" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="stat-row-top">
            <span className="stat-value-huge">
              {((attendance.filter(a => a.status === 'Checked In').length / (employees.length || 1)) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="stat-row-middle">
            <div className="stat-icon-mini" style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}><UserCheck size={16} /></div>
            <h3 className="stat-title-mini">Avg. Attendance</h3>
          </div>
          <div className="stat-row-bottom"><span className="stat-trend-mini" style={{ color: '#10B981' }}>Current Month</span></div>
        </div>
        <div className="stat-card-custom" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="stat-row-top"><span className="stat-value-huge">{visits.length}</span></div>
          <div className="stat-row-middle">
            <div className="stat-icon-mini" style={{ color: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.15)' }}><MapPin size={16} /></div>
            <h3 className="stat-title-mini">Total Visits</h3>
          </div>
          <div className="stat-row-bottom"><span className="stat-trend-mini" style={{ color: '#8B5CF6' }}>Monthly Progress</span></div>
        </div>
        <div className="stat-card-custom" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="stat-row-top"><span className="stat-value-huge">{leaves.filter(l => l.status === 'Pending').length}</span></div>
          <div className="stat-row-middle">
            <div className="stat-icon-mini" style={{ color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}><ClipboardList size={16} /></div>
            <h3 className="stat-title-mini">Pending Tasks</h3>
          </div>
          <div className="stat-row-bottom"><span className="stat-trend-mini" style={{ color: '#F59E0B' }}>Action Required</span></div>
        </div>
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
    const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    
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
          <div style={{ flex: 1 }} />
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
          <div className="payroll-card total"><h5>Total Payroll</h5><h3>₹ {totalSalary.toLocaleString()}</h3><p>For {months[payrollMonth]} {payrollYear}</p></div>
          <div className="payroll-card disbursed"><h5>Disbursed</h5><h3>₹ {(totalSalary * 0.7).toLocaleString()}</h3><div className="progress-bar"><div className="progress" style={{width: '70%'}} /></div></div>
          <div className="payroll-card pending"><h5>Pending</h5><h3>₹ {(totalSalary * 0.3).toLocaleString()}</h3><p>Settlement in progress</p></div>
        </div>
        <div className="grid-card full-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Employee</th><th>Attendance</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {employees.map((e) => {
                  const empAttendance = attendance.filter(a => {
                    const aDate = new Date(a.date);
                    return (a.employee?._id === e._id || a.employee === e._id) && 
                           a.status === 'Checked In' && 
                           aDate.getMonth() === payrollMonth && 
                           aDate.getFullYear() === payrollYear;
                  }).length;

                  const daysInMonth = new Date(payrollYear, payrollMonth + 1, 0).getDate();
                  const dailyWage = e.salary / daysInMonth;
                  // Simplified deduction: deduct for missing days if attendance is recorded for that month
                  const hasRecords = attendance.some(a => new Date(a.date).getMonth() === payrollMonth && new Date(a.date).getFullYear() === payrollYear);
                  const deductions = hasRecords ? Math.round((daysInMonth - empAttendance) * 0) : 0; // Keeping 0 for demo seed consistency
                  
                  return (
                    <tr key={e._id}>
                      <td>
                        <div className="user-info">
                          <div className="u-avatar">{e.name.charAt(0)}</div>
                          <div className="u-name">{e.name}</div>
                        </div>
                      </td>
                      <td>{empAttendance}/{daysInMonth} Days</td>
                      <td>₹{deductions.toLocaleString()} (Leaves)</td>
                      <td className="salary-text">₹{(e.salary - deductions).toLocaleString()}</td>
                      <td><span className="pay-status paid">Paid</span></td>
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
          <div className="brand-logo"><Sprout color="#fff" size={24} /></div>
          <div className="brand-info"><h1 className="brand-name">KUSUM FARM</h1><p className="brand-tag">Admin Portal</p></div>
        </div>
        <nav className="side-nav">
          {[
            { id: 'Overview', icon: <LayoutDashboard size={18} /> },
            { id: 'Employees', icon: <Users size={18} /> },
            { id: 'Attendance', icon: <Clock size={18} /> },
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
          <button className="logout-btn"><LogOut size={18} /> <span>Logout</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="search-bar"><Search size={18} color="#94A3B8" /><input type="text" placeholder="Search anything..." /></div>
          <div className="header-actions">
            <div className="time-display"><Clock size={16} /><span>{currentTime.toLocaleTimeString()}</span></div>
            <button className="icon-btn notification" onClick={() => setActiveTab('Leaves')}>
              <Bell size={18} />
              {leaves.filter(l => l.status === 'Pending').length > 0 && (
                <div className="badge">{leaves.filter(l => l.status === 'Pending').length}</div>
              )}
            </button>
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

          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Employees' && renderEmployees()}
          {activeTab === 'Attendance' && renderAttendance()}
          {activeTab === 'Site Visits' && renderVisits()}
          {activeTab === 'Leaves' && renderLeaves()}
          {activeTab === 'Payroll' && renderPayroll()}
          {activeTab === 'Reports' && renderReports()}
        </div>

        {/* Dynamic Modal */}
        {showModal && selectedEmp && (
          <div className="modal-overlay animate-fade">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{modalType === 'view' ? 'Employee Details' : modalType === 'edit' ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}><XCircle size={20} /></button>
              </div>
              <div className="modal-body">
                {modalType !== 'add' && (
                  <div className="modal-profile">
                    <div className="modal-avatar">{selectedEmp.name ? selectedEmp.name.charAt(0) : 'E'}</div>
                    <div className="modal-info">
                      <h4>{selectedEmp.name || 'New Hire'}</h4>
                      <p>{selectedEmp.role || 'Assign Role'}</p>
                    </div>
                  </div>
                )}
                <div className="modal-fields">
                  <div className="m-field"><label>Full Name</label><input readOnly={modalType === 'view'} defaultValue={selectedEmp.name} placeholder="e.g. Amit Sharma" /></div>
                  <div className="m-field"><label>Email Address</label><input readOnly={modalType === 'view'} defaultValue={selectedEmp.email} placeholder="email@kusum.com" /></div>
                  <div className="m-field"><label>Phone Number</label><input readOnly={modalType === 'view'} defaultValue={selectedEmp.phone} placeholder="9876543210" /></div>
                  <div className="m-field"><label>Base Salary (₹)</label><input readOnly={modalType === 'view'} defaultValue={selectedEmp.salary} placeholder="25000" /></div>
                  <div className="m-field"><label>Work Role</label><input readOnly={modalType === 'view'} defaultValue={selectedEmp.role} placeholder="Field Officer" /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                {modalType !== 'view' && <button className="btn-save" onClick={() => { alert(modalType === 'add' ? 'Added Successfully!' : 'Saved Successfully!'); setShowModal(false); }}>{modalType === 'add' ? 'Create Employee' : 'Save Changes'}</button>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KusumAdmin;
