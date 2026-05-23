import React, { useState, useEffect, useRef, createElement } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, RefreshControl, Alert, Modal
} from 'react-native';
import {
  Clock, Calendar, FileText, Bell, Menu, Sun, CheckCircle2, Navigation,
  CreditCard, LogOut, Briefcase, Mail, Lock, History, MapPin,
  ChevronRight, User, CheckCircle, XCircle, Palmtree,
  ArrowRightCircle, Download, Send, PlusCircle, Leaf, Sprout,
  Building2, Camera, Plus, Home, LayoutDashboard, Search, Settings, Phone, Info,
  FileDown, Target, UserCheck, UserX, AlertTriangle, TrendingUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BRAND_NAME, PRIMARY_COLOR } from './constants';
import { LOGO_BASE64 } from './logo';

const { width } = Dimensions.get('window');
const API_URL = 'http://localhost:5000/api';
const MAX_WIDTH = 480;

const formatPunchTime = (punch) => {
  if (!punch) return '-';
  if (punch.timestamp) {
    return new Date(punch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }
  return punch.time || '-';
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [attendanceView, setAttendanceView] = useState('Daily');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (title, message, type = 'success') => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
    });
  };


  const [clientName, setClientName] = useState('');
  const [cityName, setCityName] = useState('');
  const [farmerDOB, setFarmerDOB] = useState('');
  const [showFarmerDOBPicker, setShowFarmerDOBPicker] = useState(false);
  const [farmerContact, setFarmerContact] = useState('');
  const [monthlySellVolume, setMonthlySellVolume] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitImage, setVisitImage] = useState(null);
  const [visitImageBase64, setVisitImageBase64] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [visitView, setVisitView] = useState('New'); // 'New' or 'History'
  const [visitHistory, setVisitHistory] = useState([]);
  const trackingInterval = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [locationName, setLocationName] = useState("Thambu Chetty St, Chennai");

  const [attendance, setAttendance] = useState({ present: 13, absents: 2, late: 4 });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    total: 30, available: 25, applied: 5, approved: 3, pending: 1, rejected: 1
  });
  const [token, setToken] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('All');

  // Leave Form State
  const [lType, setLType] = useState('Casual Leave');
  const [showLeaveDropdown, setShowLeaveDropdown] = useState(false);
  const [lStart, setLStart] = useState(new Date());
  const [lEnd, setLEnd] = useState(new Date());
  const [lReason, setLReason] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [visitStartLocation, setVisitStartLocation] = useState(null);

  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const onStartChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) setLStart(selectedDate);
  };

  const onEndChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) setLEnd(selectedDate);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkLoginStatus();
    getLocation();
    return () => {
      clearInterval(timer);
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName("Location Permission Denied");
        showCustomAlert('Permission Denied', 'Please click the lock icon 🔒 in your browser URL bar, allow Location access, and try again.', 'error');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      if (Platform.OS === 'web') {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',').map(s => s.trim());
            const uniqueParts = [...new Set(parts)].slice(0, 3);
            setLocationName(uniqueParts.join(', '));
            return;
          }
        } catch (err) {
          console.log("Web Geocode Error", err);
        }
        setLocationName(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        return;
      }

      let address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      if (address && address[0]) {
        const addr = address[0];
        const fullAddr = `${addr.name || ''} ${addr.street || ''}, ${addr.city || addr.district || ''}`.trim().replace(/^,/, '').trim();
        setLocationName(fullAddr || "Location Captured");
      }
    } catch (e) {
      console.log("Location Error", e);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchData();
      getLocation();
    }
  }, [isLoggedIn, token]);

  const checkLoginStatus = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('token');
      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        setIsLoggedIn(true);
      }
    } catch (e) { }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const [attRes, leaveRes, visitRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/history/${user._id || user.id}`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_URL}/leaves/history/${user._id || user.id}`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_URL}/visits/employee/${user._id || user.id}`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } })
      ]);

      if (profileRes.data) {
        setUser(profileRes.data);
        await AsyncStorage.setItem('user', JSON.stringify(profileRes.data));
      }

      setAttendanceHistory(attRes.data || []);
      setLeaveHistory(leaveRes.data || []);
      setVisitHistory(visitRes.data || []);

      const month = new Date().getMonth();
      const monthAtt = (attRes.data || []).filter(a => new Date(a.date).getMonth() === month);
      setAttendance({
        present: monthAtt.filter(a => a.punches && a.punches.length > 0).length,
        absents: 0,
        late: monthAtt.filter(a => a.status === 'Late').length
      });

      const today = new Date().toLocaleDateString('en-CA');
      const todayAtt = (attRes.data || []).find(a => a.date === today);
      if (todayAtt && todayAtt.punches && todayAtt.punches.length > 0) {
        const lastPunch = todayAtt.punches[todayAtt.punches.length - 1];
        setIsCheckedIn(lastPunch.type === 'In');
      } else {
        setIsCheckedIn(false);
      }

    } catch (err) {
      console.error('Fetch Data Error:', err);
      if (err.response && err.response.status === 401) {
        await handleLogout();
        showCustomAlert('Session Expired', 'Your session has expired. Please login again.', 'error');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user || !token) return;
    try {
      const res = await axios.get(`${API_URL}/notifications/${user._id || user.id}`, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Fetch Notifications Error:', err);
      if (err.response && err.response.status === 401) {
        await handleLogout();
      }
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/read/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Mark Read Error:', err);
      if (err.response && err.response.status === 401) {
        await handleLogout();
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Fetch every minute
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user]);

  const handleLogin = async () => {
    if (!email || !password) return showCustomAlert('Error', 'Enter credentials', 'error');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      await AsyncStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setToken(res.data.token);
      setIsLoggedIn(true);
    } catch (err) {
      showCustomAlert('Login Failed', err.response?.data?.message || err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleApplyLeave = async () => {
    if (!lStart || !lReason) return showCustomAlert('Error', 'Please fill required fields', 'error');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/leaves/apply`, {
        employeeId: user._id || user.id,
        leaveType: lType,
        startDate: lStart.toLocaleDateString('en-CA'),
        endDate: lEnd.toLocaleDateString('en-CA'),
        reason: lReason
      });
      showCustomAlert('Success', 'Leave application submitted', 'success');
      setShowLeaveModal(false);
      setLStart(new Date()); setLEnd(new Date()); setLReason('');
      fetchData();
    } catch (err) {
      showCustomAlert('Error', 'Failed to submit application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName || !editEmail) return showCustomAlert('Error', 'Name and Email are required', 'error');
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/employees/profile/update`, {
        name: editName,
        email: editEmail,
        phone: editPhone
      }, {
        headers: { 'x-auth-token': token }
      });
      
      const updatedUser = res.data;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      showCustomAlert('Success', 'Profile updated successfully', 'success');
      setProfileSuccess(true);
      setTimeout(() => {
        setProfileSuccess(false);
        setShowEditProfileModal(false);
      }, 2000);
    } catch (err) {
      showCustomAlert('Error', 'Failed to update profile', 'error');
      console.error(err);
      if (err.response && err.response.status === 401) {
        await handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user', 'token']);
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    stopTracking();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return showCustomAlert('Error', 'Camera permission required to take site photos', 'error');

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled) {
      setVisitImage(result.assets[0].uri);
      setVisitImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const startTracking = (startLoc) => {
    setIsTracking(true);
    const initialLoc = startLoc || visitStartLocation;
    if (trackingInterval.current) clearInterval(trackingInterval.current);
    trackingInterval.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const currentPos = { lat: loc.coords.latitude, lng: loc.coords.longitude };

        // Check distance if we have a start location
        if (initialLoc) {
          const distance = calculateDistance(
            initialLoc.lat, initialLoc.lng,
            currentPos.lat, currentPos.lng
          );

          if (distance > 1) { // 1km range
            showCustomAlert(
              "Range Alert",
              `You have moved ${distance.toFixed(2)}km away from the site. Please stay within 1km.`,
              'warning'
            );
            // Optionally notify backend about range violation
            await axios.post(`${API_URL}/visits/track`, {
              employeeId: user._id || user.id,
              location: currentPos,
              notes: `OUT OF RANGE: ${distance.toFixed(2)}km`
            });
          } else {
            await axios.post(`${API_URL}/visits/track`, {
              employeeId: user._id || user.id,
              location: currentPos,
              notes: 'Periodic Tracking'
            });
          }
        } else {
          await axios.post(`${API_URL}/visits/track`, {
            employeeId: user._id || user.id,
            location: currentPos
          });
        }
      } catch (e) { console.error('Tracking Error', e); }
    }, 60000); // Check every minute
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval.current) clearInterval(trackingInterval.current);
  };

  const handleSiteVisit = async () => {
    if (!clientName || !cityName || !visitPurpose || !visitImage || !farmerContact || !monthlySellVolume || !farmerDOB) {
      return showCustomAlert('Error', 'Please fill all fields and take a photo', 'error');
    }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      let lat = 19.0760;
      let lng = 72.8777;

      if (status !== 'granted') {
        setLoading(false);
        return showCustomAlert('Error', 'Location permission is required to get your exact location. Please allow it in your browser/device settings.', 'error');
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;

      const visitData = {
        employeeId: user._id || user.id,
        clientName,
        cityName,
        purpose: visitPurpose,
        imageUrl: visitImageBase64 || "",
        location: {
          lat: lat,
          lng: lng,
          address: "Site Visit Location"
        },
        farmerDOB: farmerDOB,
        farmerContact,
        monthlySellVolume
      };

      await axios.post(`${API_URL}/visits/log`, visitData);
      showCustomAlert('Success', 'Visit recorded! Movement tracking started.', 'success');
      setClientName('');
      setCityName('');
      setVisitPurpose('');
      setVisitImage(null);
      setVisitImageBase64(null);
      setFarmerDOB('');
      setFarmerContact('');
      setMonthlySellVolume('');
      const startLoc = { lat: lat, lng: lng };
      setVisitStartLocation(startLoc);
      startTracking(startLoc);
      setActiveTab('Home');
    } catch (err) {
      showCustomAlert('Error', 'Failed to log visit: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const type = isCheckedIn ? 'Out' : 'In';
      const res = await axios.post(`${API_URL}/attendance/punch`, {
        employeeId: user._id || user.id,
        type,
        location: locationName
      });
      setIsCheckedIn(!isCheckedIn);
      fetchData();
      showCustomAlert(`Successfully punched ${type}`, `Total working hours today: ${res.data.totalHours || '00h 00m'}`, 'success');
    } catch (err) {
      showCustomAlert('Punch Failed', err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (monthIndex) => {
    console.log('Generating PDF for month index:', monthIndex);
    const year = 2026;
    const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
    
    // Ensure history exists
    if (!attendanceHistory || attendanceHistory.length === 0) {
      showCustomAlert('Empty History', 'Please wait for your attendance history to load.', 'info');
      return;
    }

    const monthLogs = attendanceHistory.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('Found logs:', monthLogs.length);

    setLoading(true);
    try {
      const presentCount = monthLogs.filter(a => a.punches && a.punches.length > 0).length;
      const lateCount = monthLogs.filter(a => a.status === 'Late').length;
      const absentCount = new Date(year, monthIndex + 1, 0).getDate() - presentCount;

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; padding: 40px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
              .brand-container { display: flex; align-items: center; gap: 15px; }
              .brand-logo-premium { 
                width: 50px; height: 50px; background: #ffffff; border-radius: 50%; 
                display: flex; align-items: center; justify-content: center; overflow: hidden; 
                box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15); border: 1px solid #10B981; padding: 6px; 
              }
              .brand-logo-premium img { width: 100%; height: 100%; object-fit: contain; }
              .brand-name { font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: 1px; margin: 0; }
              .report-title { text-align: right; }
              .report-title h1 { margin: 0; font-size: 20px; color: #64748b; }
              .report-title p { margin: 5px 0 0; font-size: 14px; color: #94a3b8; }
              
              .employee-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
              .info-group h3 { margin: 0 0 5px; font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
              .info-group p { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }

              .stats-grid { display: flex; gap: 20px; margin-bottom: 30px; }
              .stat-card { flex: 1; background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; text-align: center; }
              .stat-card h4 { margin: 0 0 5px; font-size: 11px; color: #64748b; text-transform: uppercase; }
              .stat-card p { margin: 0; font-size: 20px; font-weight: 800; }
              .stat-present { color: #10b981; }
              .stat-absent { color: #ef4444; }
              .stat-late { color: #f59e0b; }

              table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              th { background: #2563eb; color: #fff; text-align: left; padding: 12px 15px; font-size: 13px; text-transform: uppercase; }
              td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .status-present { color: #10b981; font-weight: 700; }
              .status-absent { color: #ef4444; font-weight: 700; }
              .footer { margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand-container">
                <div class="brand-logo-premium">
                  <img src="${LOGO_BASE64}" alt="Logo" />
                </div>
                <div class="brand-name">KUSUM FARM</div>
              </div>
              <div class="report-title">
                <h1>Attendance Report</h1>
                <p>${monthName} ${year}</p>
              </div>
            </div>

            <div class="employee-info">
              <div class="info-group">
                <h3>Employee Name</h3>
                <p>${user?.name || 'Rahul Singh'}</p>
              </div>
              <div class="info-group">
                <h3>Employee ID</h3>
                <p>${(user?._id || user?.id || 'EMP001').substring(0, 8).toUpperCase()}</p>
              </div>
              <div class="info-group">
                <h3>Designation</h3>
                <p>${user?.designation || 'Field Manager'}</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <h4>Total Days</h4>
                <p>${new Date(year, monthIndex + 1, 0).getDate()}</p>
              </div>
              <div class="stat-card">
                <h4>Present</h4>
                <p class="stat-present">${presentCount}</p>
              </div>
              <div class="stat-card">
                <h4>Absent</h4>
                <p class="stat-absent">${absentCount}</p>
              </div>
              <div class="stat-card">
                <h4>Late In</h4>
                <p class="stat-late">${lateCount}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Status</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                ${monthLogs.length > 0 ? monthLogs.map(log => `
                  <tr>
                    <td>${new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', weekday: 'short' })}</td>
                    <td>${formatPunchTime(log.punches?.find(p => p.type === 'In'))}</td>
                    <td>${formatPunchTime(log.punches?.filter(p => p.type === 'Out').slice(-1)[0])}</td>
                    <td class="${log.status === 'Checked In' || log.status === 'Present' ? 'status-present' : 'status-absent'}">${log.status}</td>
                    <td>${log.totalWorkingHours || '00h 00m'}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #94a3b8; font-style: italic;">
                      No attendance records found for ${monthName} ${year}
                    </td>
                  </tr>
                `}
              </tbody>
            </table>

            <div class="footer">
              <p>This is a computer-generated document for KUSUM FARM Payroll System.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error(error);
      showCustomAlert('Error', 'Failed to generate PDF report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    fetchData();
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.loginLogo}>
            <Sprout color="#fff" size={40} />
          </LinearGradient>
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSub}>Sign in to manage your attendance</Text>

          <View style={styles.inputBox}>
            <Mail color="#64748B" size={20} />
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <Lock color="#64748B" size={20} />
            <TextInput
              placeholder="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderHome = () => (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <Text style={styles.companyLabel}>KUSUM FARM</Text>
        <View style={styles.headerTop}>
          <View style={styles.headerUserRow}>
            <View style={styles.headerProfileContainer}>
              <Image 
                source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6' }} 
                style={styles.headerProfileImage} 
              />
              <View style={styles.onlineStatus} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.welcomeLabel}>Welcome Kusum</Text>
              <Text style={styles.welcomeText}>{user?.name || 'Rahul Singh'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowNotificationsModal(true)}>
            <Bell color="#fff" size={20} />
            {unreadCount > 0 && <View style={styles.notifDot}><Text style={styles.notifDotText}>{unreadCount}</Text></View>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.liveLocationCard} onPress={getLocation}>
          <View style={styles.locIconInner}>
            <MapPin color="#fff" size={16} />
          </View>
          <View style={styles.locInfo}>
            <Text style={styles.locLabel}>Live Location</Text>
            <Text style={styles.locVal} numberOfLines={2}>{locationName}</Text>
          </View>
          <View style={styles.livePulseContainer}>
            <View style={styles.livePulse} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {isTracking && (
        <View style={styles.trackingBanner}>
          <Target color="#fff" size={16} />
          <Text style={styles.trackingBannerText}>Live Movement Tracking Active</Text>
          <TouchableOpacity onPress={stopTracking}><XCircle color="#fff" size={18} /></TouchableOpacity>
        </View>
      )}

      <View style={styles.punchContainer}>
        <View style={styles.punchCard}>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={styles.toggleBtnActive}>
              <Home color="#fff" size={16} /><Text style={styles.toggleTextActive}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn}>
              <Building2 color="#64748B" size={16} /><Text style={styles.toggleText}>Office</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeSection}>
            <View style={styles.shiftBadge}>
              <Text style={styles.shiftText}>GENERAL SHIFT</Text>
            </View>
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </Text>
          </View>

          <View style={styles.btnRow}>
            {isCheckedIn && (
              <TouchableOpacity style={styles.breakBtn}>
                <Text style={styles.breakBtnText}>Break</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.punchBtn}
              onPress={handlePunch}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.punchBtnText}>{isCheckedIn ? 'Punch Out' : 'Punch In'}</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statCircle}><Clock color="#2563EB" size={16} /></View>
              <Text style={styles.statVal}>10:00 AM</Text>
              <Text style={styles.statLabel}>Punch In</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statCircle}><Clock color="#2563EB" size={16} /></View>
              <Text style={styles.statVal}>06:30 PM</Text>
              <Text style={styles.statLabel}>Punch Out</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statCircle}><Clock color="#059669" size={16} /></View>
              <Text style={styles.statVal}>{attendanceHistory.find(a => a.date === new Date().toLocaleDateString('en-CA'))?.totalWorkingHours || '00h 00m'}</Text>
              <Text style={styles.statLabel}>Working HR's</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.attendanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance for this Month</Text>
          <View style={styles.monthBadge}>
            <Text style={styles.monthText}>{new Date().toLocaleString('default', { month: 'short' }).toUpperCase()}</Text><Calendar color="#64748B" size={14} />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.gridItem, { borderTopColor: '#2563EB' }]}>
            <View style={[styles.gridIconBg, { backgroundColor: 'transparent' }]}>
              <UserCheck color="#22C55E" size={14} />
            </View>
            <Text style={styles.gridLabel}>Present</Text>
            <Text style={styles.gridVal}>{attendance.present}</Text>
          </View>

          <View style={[styles.gridItem, { borderTopColor: '#2563EB' }]}>
            <View style={[styles.gridIconBg, { backgroundColor: 'transparent' }]}>
              <UserX color="#EF4444" size={14} />
            </View>
            <Text style={styles.gridLabel}>Absents</Text>
            <Text style={styles.gridVal}>{attendance.absents}</Text>
          </View>

          <View style={[styles.gridItem, { borderTopColor: '#2563EB' }]}>
            <View style={[styles.gridIconBg, { backgroundColor: 'transparent' }]}>
              <Clock color="#F59E0B" size={14} />
            </View>
            <Text style={styles.gridLabel}>Late in</Text>
            <Text style={styles.gridVal}>{attendance.late}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.requestBtnOuter} onPress={() => setActiveTab('Visits')}>
        <View style={styles.requestBtnInner}>
          <MapPin color="#0F172A" size={22} /><Text style={styles.requestBtnText}>Record Site Visit</Text>
        </View>
      </TouchableOpacity>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderAttendance = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('Home')}>
          <ChevronRight color="#2563EB" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Calendar color="#2563EB" size={20} style={{ marginRight: 10 }} />
        <Text style={styles.subHeaderTitle}>Attendance Details</Text>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.viewToggleRow}>
          <TouchableOpacity 
            style={[styles.viewToggleBtn, attendanceView === 'Daily' && styles.viewToggleBtnActive]} 
            onPress={() => setAttendanceView('Daily')}
          >
            <History color={attendanceView === 'Daily' ? '#2563EB' : '#64748B'} size={18} style={{ marginRight: 8 }} />
            <Text style={[styles.viewToggleText, attendanceView === 'Daily' && styles.viewToggleTextActive]}>Daily Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewToggleBtn, attendanceView === 'Monthly' && styles.viewToggleBtnActive]} 
            onPress={() => setAttendanceView('Monthly')}
          >
            <Calendar color={attendanceView === 'Monthly' ? '#2563EB' : '#64748B'} size={18} style={{ marginRight: 8 }} />
            <Text style={[styles.viewToggleText, attendanceView === 'Monthly' && styles.viewToggleTextActive]}>Monthly Cards</Text>
          </TouchableOpacity>
        </View>

        {attendanceView === 'Daily' ? (
          <>
            <View style={styles.listTitleRow}><Text style={styles.listTitle}>Attendance History</Text></View>
            {attendanceHistory.map((item, i) => (
              <View key={i} style={styles.attendanceCard}>
                <View style={styles.blueVerticalBar} />
                <View style={styles.cardContent}>
                  <View style={styles.attRow}>
                    <Text style={styles.attDateText}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'Checked In' || item.status === 'Present' ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={[styles.statusText, { color: item.status === 'Checked In' || item.status === 'Present' ? '#166534' : '#EF4444' }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.attStatsRow}>
                    <View style={styles.attStat}>
                      <View style={styles.attIconSmall}><Clock color="#16A34A" size={12} /></View>
                      <View>
                        <Text style={[styles.attStatVal, { color: '#16A34A' }]}>{formatPunchTime(item.punches?.find(p => p.type === 'In'))}</Text>
                        <Text style={styles.attStatLabel}>In</Text>
                      </View>
                    </View>
                    <View style={styles.attStat}>
                      <View style={styles.attIconSmall}><LogOut color="#DC2626" size={12} /></View>
                      <View>
                        <Text style={[styles.attStatVal, { color: '#DC2626' }]}>{formatPunchTime(item.punches?.filter(p => p.type === 'Out').slice(-1)[0])}</Text>
                        <Text style={styles.attStatLabel}>Out</Text>
                      </View>
                    </View>
                    <View style={styles.attStat}>
                      <View style={styles.attIconSmall}><History color="#64748B" size={12} /></View>
                      <View>
                        <Text style={[styles.attStatVal, { color: '#0F172A' }]}>{item.totalWorkingHours || '00h 00m'}</Text>
                        <Text style={styles.attStatLabel}>Hrs</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          ['May', 'April', 'March', 'February', 'January'].map((m, idx) => (
            <TouchableOpacity 
              key={m} 
              style={styles.monthlyCard} 
              onPress={() => {
                console.log('Card pressed:', m);
                generatePDF(4 - idx);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.monthlyCardLeft}>
                <View style={styles.monthIconBg}><Calendar color="#2563EB" size={24} /></View>
                <Text style={styles.monthlyMonthName}>{m} 2026</Text>
              </View>
              <FileDown color="#2563EB" size={24} />
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderSiteVisit = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.visitHeader}>
        <View style={styles.visitHeaderTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.visitBackBtn} onPress={() => setActiveTab('Home')}>
              <ChevronRight color="#fff" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.visitHeaderTitle}>Site Visit Tracking</Text>
          </View>
          <TouchableOpacity style={styles.visitHeaderBtn} onPress={() => setVisitView(visitView === 'New' ? 'History' : 'New')}>
            <History color="#fff" size={18} />
          </TouchableOpacity>
        </View>
        <View style={styles.visitToggleContainer}>
          <TouchableOpacity
            style={[styles.visitTab, visitView === 'New' && styles.visitTabActive]}
            onPress={() => setVisitView('New')}
          >
            <PlusCircle color={visitView === 'New' ? '#2563EB' : '#fff'} size={18} />
            <Text style={[styles.visitTabText, visitView === 'New' && styles.visitTabTextActive]}>New Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visitTab, visitView === 'History' && styles.visitTabActive]}
            onPress={() => setVisitView('History')}
          >
            <History color={visitView === 'History' ? '#2563EB' : '#fff'} size={18} />
            <Text style={[styles.visitTabText, visitView === 'History' && styles.visitTabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.listContainer}>
        {visitView === 'New' ? (
          <View style={styles.visitFormCard}>
            <View style={styles.formHeaderRow}>
              <View style={styles.formIconBg}><MapPin color="#2563EB" size={24} /></View>
              <View>
                <Text style={styles.formTitle}>Add Visit Record</Text>
                <Text style={styles.formSub}>Enter client and farm details</Text>
              </View>
            </View>

            <Text style={styles.formLabel}>Client / Farm Name</Text>
            <View style={styles.formInputBox}>
              <Building2 color="#64748B" size={20} />
              <TextInput style={styles.formInput} placeholder="Enter name" value={clientName} onChangeText={setClientName} />
            </View>

            <Text style={styles.formLabel}>City Name</Text>
            <View style={styles.formInputBox}>
              <MapPin color="#64748B" size={20} />
              <TextInput style={styles.formInput} placeholder="Enter city name" value={cityName} onChangeText={setCityName} />
            </View>

            <Text style={styles.formLabel}>Purpose of Visit</Text>
            <View style={styles.formInputBox}>
              <Briefcase color="#64748B" size={20} />
              <TextInput style={styles.formInput} placeholder="e.g. Product Demo" value={visitPurpose} onChangeText={setVisitPurpose} />
            </View>

            <Text style={styles.formLabel}>Farmer Date of Birth</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.formInputBox}>
                <Calendar color="#64748B" size={20} style={{ flexShrink: 0 }} />
                {createElement('input', {
                  type: 'date',
                  value: farmerDOB ? farmerDOB.split('/').reverse().join('-') : '',
                  onChange: (e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-');
                      setFarmerDOB(`${d}/${m}/${y}`);
                    } else {
                      setFarmerDOB('');
                    }
                  },
                  style: { flex: 1, height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: '600', color: '#0F172A', marginLeft: 8 }
                })}
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.formInputBox} onPress={() => setShowFarmerDOBPicker(true)}>
                  <Calendar color="#64748B" size={20} />
                  <Text style={[styles.formInput, { paddingTop: 15, color: farmerDOB ? '#0F172A' : '#94A3B8' }]}>
                    {farmerDOB || 'Select Date of Birth'}
                  </Text>
                </TouchableOpacity>
                {showFarmerDOBPicker && (
                  <DateTimePicker
                    value={farmerDOB ? new Date(farmerDOB.split('/').reverse().join('-')) : new Date(1990, 0, 1)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowFarmerDOBPicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const yyyy = selectedDate.getFullYear();
                        setFarmerDOB(`${dd}/${mm}/${yyyy}`);
                      }
                    }}
                  />
                )}
              </>
            )}

            <Text style={styles.formLabel}>Farmer Contact Number</Text>
            <View style={styles.formInputBox}>
              <Phone color="#64748B" size={20} />
              <TextInput style={styles.formInput} placeholder="Enter 10-digit number" value={farmerContact} onChangeText={setFarmerContact} keyboardType="phone-pad" maxLength={10} />
            </View>

            <Text style={styles.formLabel}>Monthly Sell Volume (kg/tons)</Text>
            <View style={styles.formInputBox}>
              <TrendingUp color="#64748B" size={20} />
              <TextInput style={styles.formInput} placeholder="e.g. 500 kg" value={monthlySellVolume} onChangeText={setMonthlySellVolume} />
            </View>

            <Text style={styles.formLabel}>Site Photo</Text>
            <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
              {visitImage ? (
                <Image source={{ uri: visitImage }} style={styles.pickedImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera color="#2563EB" size={40} />
                  <Text style={styles.photoText}>Tap to capture site photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.submitVisitBtn, { backgroundColor: '#2563EB' }]} onPress={handleSiteVisit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Send color="#fff" size={20} style={{ marginRight: 10 }} />
                  <Text style={styles.submitVisitText}>Send Record & Start Tracking</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {visitHistory.length === 0 ? (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>No visit history found</Text></View>
            ) : visitHistory.map((item, i) => {
              const borderColors = ['#22C55E', '#EF4444', '#F59E0B'];
              return (
                <View key={i} style={[styles.historyCard, { borderTopColor: borderColors[i % 3] }]}>
                  <View style={styles.historyTop}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyClient}>{item.clientName}</Text>
                      <Text style={styles.historyPurpose}>{item.purpose}</Text>
                      <View style={styles.historyTimeRow}>
                        <Clock color="#94A3B8" size={14} />
                        <Text style={styles.historyTime}>{new Date(item.timestamp).toLocaleString()}</Text>
                      </View>
                    </View>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.historyThumb} />
                    ) : (
                      <View style={styles.historyThumbPlaceholder}><Camera color="#CBD5E1" size={20} /></View>
                    )}
                  </View>
                  <View style={styles.historyFooter}>
                    <View style={styles.locBadge}>
                      <MapPin color="#10B981" size={12} />
                      <Text style={styles.locBadgeText}>Verified GPS Location Captured</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderReports = () => {
    const filteredLeaves = leaveHistory.filter(l => leaveFilter === 'All' || l.status === leaveFilter);

    return (
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('Home')}><ChevronRight color="#000" size={24} style={{ transform: [{ rotate: '180deg' }] }} /></TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Leave Details</Text>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listTitle}>Leave Status</Text>
            <TouchableOpacity style={styles.addLeaveBtn} onPress={() => setShowLeaveModal(true)}>
              <Text style={styles.addLeaveText}>Leave</Text>
              <PlusCircle color="#2563EB" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.leaveGrid}>
            <View style={[styles.leaveGridItem, { backgroundColor: '#F8FAFC' }]}>
              <View style={styles.iconContainer}><FileText color="#64748B" size={16} /></View>
              <Text style={styles.leaveGridLabel}>Total</Text>
              <Text style={styles.leaveGridVal}>{leaveStats.total}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#EFF6FF' }]}>
              <View style={styles.iconContainer}><CheckCircle color="#2563EB" size={16} /></View>
              <Text style={styles.leaveGridLabel}>Available</Text>
              <Text style={styles.leaveGridVal}>{leaveStats.available}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#F0FDFA' }]}>
              <View style={styles.iconContainer}><Send color="#0D9488" size={16} /></View>
              <Text style={styles.leaveGridLabel}>Applied</Text>
              <Text style={styles.leaveGridVal}>{leaveHistory.length}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#F0FDF4' }]}>
              <View style={styles.iconContainer}><CheckCircle2 color="#16A34A" size={16} /></View>
              <Text style={styles.leaveGridLabel}>Approved</Text>
              <Text style={styles.leaveGridVal}>{leaveHistory.filter(l => l.status === 'Approved').length}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#FFFBEB' }]}>
              <View style={styles.iconContainer}><Clock color="#D97706" size={16} /></View>
              <Text style={styles.leaveGridLabel}>Pending</Text>
              <Text style={styles.leaveGridVal}>{leaveHistory.filter(l => l.status === 'Pending').length}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#FEF2F2' }]}>
              <View style={styles.iconContainer}><XCircle color="#DC2626" size={16} /></View>
              <Text style={styles.leaveGridLabel}>Rejected</Text>
              <Text style={styles.leaveGridVal}>{leaveHistory.filter(l => l.status === 'Rejected').length}</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRowScroll}>
            <View style={styles.filterRow}>
              {['All', 'Approved', 'Pending', 'Rejected'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={leaveFilter === f ? styles.filterBtnActive : styles.filterBtn}
                  onPress={() => setLeaveFilter(f)}
                >
                  <Text style={leaveFilter === f ? styles.filterTextActive : styles.filterText}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filteredLeaves.map((leave, i) => (
            <View key={i} style={styles.leaveCard}>
              <View style={styles.leaveHeaderRow}>
                <View style={styles.blueDot} />
                <Text style={styles.leaveDateText}>{new Date(leave.fromDate).toLocaleDateString()} {leave.toDate ? `- ${new Date(leave.toDate).toLocaleDateString()}` : ''}</Text>
                <View style={[styles.statusBadgeSmall, { backgroundColor: leave.status === 'Approved' ? '#DCFCE7' : leave.status === 'Pending' ? '#FFFBEB' : '#FEE2E2' }]}>
                  <Text style={{ color: leave.status === 'Approved' ? '#166534' : leave.status === 'Pending' ? '#D97706' : '#DC2626', fontSize: 10, fontWeight: '700' }}>{leave.status}</Text>
                </View>
              </View>
              <View style={styles.leaveInfoRow}>
                <View>
                  <Text style={styles.leaveInfoVal}>{leave.leaveType}</Text>
                  <Text style={styles.leaveInfoLabel}>Leave Type</Text>
                </View>
                <View>
                  <Text style={styles.leaveInfoVal}>1 Day</Text>
                  <Text style={styles.leaveInfoLabel}>Applied Days</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.leaveInfoVal}>Manager</Text>
                  <Text style={styles.leaveInfoLabel}>Approved by Manager</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderProfile = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6' }} style={styles.profileImage} />
        </View>
      </LinearGradient>

      <View style={styles.profileInfoSection}>
        <Text style={styles.profileName}>{user?.name || 'Arun Kumar'}</Text>
        <View style={styles.profileSubRow}>
          <Text style={styles.profileSubText}>Full Time</Text>
          <View style={styles.dot} />
          <Text style={styles.profileSubText}>{user?.designation || 'UX Designer'}</Text>
          <View style={styles.dot} />
          <Text style={styles.profileSubText}>Joined Feb 2025</Text>
        </View>

        <View style={styles.profileDetailsCard}>
          {[
            { label: 'Mobile No.', value: user?.phone || '+91 98888 88888' },
            { label: 'Email ID', value: user?.email || 'arunkumar@gmail.com' },
            { label: 'DOB', value: '02-12-2000' },
            { label: 'Blood Group', value: 'O+' },
          ].map((item, i) => (
            <View key={i} style={[styles.profileDetailItem, i === 3 && { borderBottomWidth: 0 }]}>
              <Text style={styles.profileDetailLabel}>{item.label}</Text>
              <Text style={styles.profileDetailVal}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.profileActionBtn}>
          <View style={styles.profileActionLeft}>
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}><Bell color="#2563EB" size={20} /></View>
            <Text style={styles.actionText}>Notification</Text>
          </View>
          <View style={styles.toggleOuter}><View style={styles.toggleInner} /></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileActionBtn} onPress={() => {
          setEditName(user.name);
          setEditEmail(user.email);
          setEditPhone(user.phone || '');
          setEditDesignation(user.designation || '');
          setShowEditProfileModal(true);
        }}>
          <View style={styles.profileActionLeft}>
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}><Settings color="#2563EB" size={20} /></View>
            <Text style={styles.actionText}>Edit Profile</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileActionBtn} onPress={handleLogout}>
          <View style={styles.profileActionLeft}>
            <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}><LogOut color="#EF4444" size={20} /></View>
            <Text style={styles.actionText}>Logout</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && createElement('style', null, `
        input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        input[type="date"]::-webkit-inner-spin-button {
          display: none;
        }
      `)}
      <StatusBar barStyle="light-content" />
      {activeTab === 'Home' ? renderHome() :
        activeTab === 'Attendance' ? renderAttendance() :
          activeTab === 'Visits' ? renderSiteVisit() :
            activeTab === 'Reports' ? renderReports() : renderProfile()}

      {showEditProfileModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <XCircle color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Full Name</Text>
              <View style={styles.modalInputBox}>
                <User color="#2563EB" size={20} />
                <TextInput style={styles.formInput} value={editName} onChangeText={setEditName} placeholder="Full Name" />
              </View>

              <Text style={styles.formLabel}>Email Address</Text>
              <View style={styles.modalInputBox}>
                <Mail color="#2563EB" size={20} />
                <TextInput style={styles.formInput} value={editEmail} onChangeText={setEditEmail} placeholder="Email" keyboardType="email-address" />
              </View>

              <Text style={styles.formLabel}>Mobile Number</Text>
              <View style={styles.modalInputBox}>
                <Phone color="#2563EB" size={20} />
                <TextInput style={styles.formInput} value={editPhone} onChangeText={setEditPhone} placeholder="Phone Number" keyboardType="phone-pad" />
              </View>

              <Text style={styles.formLabel}>Designation (Fixed)</Text>
              <View style={[styles.modalInputBox, { backgroundColor: '#F1F5F9', opacity: 0.7 }]}>
                <Briefcase color="#64748B" size={20} />
                <TextInput style={styles.formInput} value={editDesignation} editable={false} placeholder="Designation" />
              </View>

              {profileSuccess && (
                <View style={styles.successMessageRow}>
                  <CheckCircle color="#16A34A" size={18} />
                  <Text style={styles.successMessageText}>Profile Updated Successfully!</Text>
                </View>
              )}

              <TouchableOpacity style={styles.submitLeaveBtn} onPress={handleUpdateProfile} disabled={loading || profileSuccess}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitLeaveText}>{profileSuccess ? 'Saved!' : 'Save All Changes'}</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {showLeaveModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                <XCircle color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Leave Type</Text>
            <TouchableOpacity 
              style={[styles.modalInputBox, { justifyContent: 'space-between', paddingRight: 16, marginBottom: showLeaveDropdown ? 16 : 16 }]} 
              onPress={() => setShowLeaveDropdown(!showLeaveDropdown)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Leaf color="#2563EB" size={20} />
                <Text style={{ marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#0F172A' }}>{lType}</Text>
              </View>
              <ChevronRight color="#64748B" size={20} style={{ transform: [{ rotate: showLeaveDropdown ? '-90deg' : '90deg' }] }} />
            </TouchableOpacity>

            {showLeaveDropdown && (
              <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, marginTop: -8, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
                {['Casual Leave', 'Sick Leave'].map((type, index) => (
                  <TouchableOpacity 
                    key={type} 
                    style={{ padding: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === 1 ? 0 : 1, borderBottomColor: '#F1F5F9', backgroundColor: lType === type ? '#EFF6FF' : '#fff' }}
                    onPress={() => {
                      setLType(type);
                      setShowLeaveDropdown(false);
                    }}
                  >
                    {lType === type ? <CheckCircle2 color="#2563EB" size={16} /> : <View style={{ width: 16 }} />}
                    <Text style={{ fontSize: 15, marginLeft: 10, color: lType === type ? '#1D4ED8' : '#334155', fontWeight: lType === type ? '600' : '500' }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Start Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.modalInputBox}>
                    <Calendar color="#2563EB" size={18} style={{ flexShrink: 0 }} />
                    {createElement('input', {
                      type: 'date',
                      value: lStart.toLocaleDateString('en-CA'),
                      min: new Date().toLocaleDateString('en-CA'),
                      onChange: (e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          setLStart(new Date(y, m - 1, d));
                        }
                      },
                      style: { flex: 1, height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: '600', color: '#0F172A', marginLeft: 8 }
                    })}
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.modalInputBox} onPress={() => setShowStartPicker(true)}>
                      <Calendar color="#2563EB" size={18} />
                      <Text style={[styles.formInput, { paddingTop: 15 }]}>{lStart.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                      <DateTimePicker
                        value={lStart}
                        mode="date"
                        display="default"
                        onChange={onStartChange}
                        minimumDate={new Date()}
                      />
                    )}
                  </>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>End Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.modalInputBox}>
                    <Calendar color="#2563EB" size={18} style={{ flexShrink: 0 }} />
                    {createElement('input', {
                      type: 'date',
                      value: lEnd.toLocaleDateString('en-CA'),
                      min: lStart.toLocaleDateString('en-CA'),
                      onChange: (e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          setLEnd(new Date(y, m - 1, d));
                        }
                      },
                      style: { flex: 1, height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: '600', color: '#0F172A', marginLeft: 8 }
                    })}
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.modalInputBox} onPress={() => setShowEndPicker(true)}>
                      <Calendar color="#2563EB" size={18} />
                      <Text style={[styles.formInput, { paddingTop: 15 }]}>{lEnd.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                      <DateTimePicker
                        value={lEnd}
                        mode="date"
                        display="default"
                        onChange={onEndChange}
                        minimumDate={lStart}
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            <Text style={styles.formLabel}>Reason</Text>
            <View style={[styles.modalInputBox, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
              <FileText color="#2563EB" size={20} />
              <TextInput
                style={[styles.formInput, { textAlignVertical: 'top' }]}
                value={lReason}
                onChangeText={setLReason}
                placeholder="Reason for leave..."
                multiline
              />
            </View>

            <TouchableOpacity style={styles.submitLeaveBtn} onPress={handleApplyLeave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitLeaveText}>Submit Application</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <XCircle color="#64748B" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Bell color="#CBD5E1" size={48} />
                  <Text style={{ marginTop: 10, color: '#94A3B8' }}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((n, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.notifCard, !n.isRead && styles.notifUnread]}
                    onPress={() => !n.isRead && markNotificationAsRead(n._id)}
                  >
                    <View style={styles.notifIconContainer}>
                      <AlertTriangle color={n.type === 'Range Alert' ? '#EF4444' : '#2563EB'} size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifMessage}>{n.message}</Text>
                      <Text style={styles.notifTime}>{new Date(n.timestamp).toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.bottomNav}>
        {[
          { t: 'Home', i: Home }, { t: 'Attendance', i: Calendar }, { t: 'Visits', i: MapPin }, { t: 'Reports', i: FileText }, { t: 'Profile', i: User }
        ].map((item, i) => {
          const Icon = item.i;
          return (
            <TouchableOpacity key={i} style={styles.navItem} onPress={() => setActiveTab(item.t)}>
              <Icon color={activeTab === item.t ? '#2563EB' : '#94A3B8'} size={24} />
              <Text style={[styles.navLabel, activeTab === item.t && styles.navActive]}>{item.t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal
        visible={customAlert.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <View style={[
              styles.alertIconBg,
              customAlert.type === 'success' && { backgroundColor: '#ECFDF5' },
              customAlert.type === 'error' && { backgroundColor: '#FEE2E2' },
              customAlert.type === 'warning' && { backgroundColor: '#FFFBEB' },
              customAlert.type === 'info' && { backgroundColor: '#EFF6FF' },
            ]}>
              {customAlert.type === 'success' && <CheckCircle2 color="#10B981" size={40} />}
              {customAlert.type === 'error' && <XCircle color="#EF4444" size={40} />}
              {customAlert.type === 'warning' && <AlertTriangle color="#F59E0B" size={40} />}
              {customAlert.type === 'info' && <Info color="#2563EB" size={40} />}
            </View>
            
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMessage}>{customAlert.message}</Text>
            
            <TouchableOpacity 
              style={[
                styles.alertBtn,
                customAlert.type === 'success' && { backgroundColor: '#10B981' },
                customAlert.type === 'error' && { backgroundColor: '#EF4444' },
                customAlert.type === 'warning' && { backgroundColor: '#F59E0B' },
                customAlert.type === 'info' && { backgroundColor: '#2563EB' },
              ]}
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 8, paddingVertical: 12, paddingTop: 45, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerUserRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerProfileContainer: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginRight: 6, position: 'relative' },
  headerProfileImage: { width: '100%', height: '100%' },
  onlineStatus: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#2563EB' },
  headerTextCol: { marginLeft: 16 },
  companyLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 4, textAlign: 'center', marginBottom: 15, textTransform: 'uppercase' },
  welcomeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  welcomeText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  liveLocationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 6, paddingVertical: 8, borderRadius: 18, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  locIconInner: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10, marginRight: 6 },
  locInfo: { flex: 1 },
  livePulseContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4444', marginRight: 6 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  locLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  locVal: { color: '#fff', fontSize: 12, fontWeight: '600' },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.12)', width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  notifDot: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#2563EB', paddingHorizontal: 4 },
  notifDotText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  notifCard: { flexDirection: 'row', padding: 15, borderRadius: 16, backgroundColor: '#F8FAFC', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#E2E8F0' },
  notifUnread: { backgroundColor: '#EFF6FF', borderLeftColor: '#2563EB' },
  notifIconContainer: { marginRight: 15, width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  notifMessage: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  trackingBanner: { flexDirection: 'row', backgroundColor: '#10B981', padding: 14, marginHorizontal: 20, marginTop: -10, marginBottom: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', zIndex: 100, elevation: 10 },
  trackingBannerText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  punchContainer: { paddingHorizontal: 20, marginTop: -20 },
  punchCard: { backgroundColor: '#fff', borderRadius: 20, padding: 10, elevation: 20, shadowColor: '#2563EB', shadowOpacity: 0.1, shadowRadius: 30 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 2, marginBottom: 10 },
  toggleBtnActive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', padding: 6, borderRadius: 8, elevation: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 6 },
  toggleTextActive: { color: '#fff', fontWeight: '800', marginLeft: 4, fontSize: 11 },
  toggleText: { color: '#64748B', fontWeight: '700', marginLeft: 4, fontSize: 11 },
  timeSection: { alignItems: 'center', marginBottom: 10 },
  shiftBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 20, marginBottom: 4, borderWidth: 1, borderColor: '#DCFCE7' },
  shiftText: { color: '#166534', fontSize: 8, fontWeight: '900' },
  timeText: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  btnRow: { flexDirection: 'row', gap: 8 },
  breakBtn: { flex: 1, borderWidth: 1.5, borderColor: '#2563EB', padding: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  breakBtnText: { color: '#2563EB', fontWeight: '800', fontSize: 13 },
  punchBtn: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  punchBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 0 },
  statItem: { alignItems: 'center' },
  statCircle: { backgroundColor: '#F8FAFC', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  statVal: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
  attendanceSection: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  monthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  monthText: { color: '#2563EB', fontSize: 12, fontWeight: '800', marginRight: 6 },
  grid: { flexDirection: 'row', gap: 8 },
  gridItem: { flex: 1, padding: 10, borderRadius: 16, borderTopWidth: 4, backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  gridIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  gridVal: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  requestBtnOuter: { marginHorizontal: 24, marginBottom: 24, borderRadius: 32, padding: 2, backgroundColor: '#2563EB10' },
  requestBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2563EB', padding: 18, borderRadius: 30, backgroundColor: '#fff', shadowColor: '#2563EB', shadowOpacity: 0.1, shadowRadius: 15 },
  requestBtnText: { color: '#2563EB', fontWeight: '900', fontSize: 17, marginLeft: 12, letterSpacing: 0.5 },
  subHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  backBtn: { marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  subHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  listContainer: { padding: 20 },
  listTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  viewToggleRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 24 },
  viewToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  viewToggleBtnActive: { backgroundColor: '#fff' },
  viewToggleText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  viewToggleTextActive: { color: '#2563EB', fontWeight: '700' },
  attendanceCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, overflow: 'hidden', flexDirection: 'row' },
  blueVerticalBar: { width: 4, backgroundColor: '#2563EB' },
  cardContent: { flex: 1, padding: 16 },
  attRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  attDateText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  attStatsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  attStat: { alignItems: 'flex-start' },
  attStatVal: { fontSize: 13, fontWeight: '800' },
  attStatLabel: { fontSize: 10, color: '#94A3B8' },
  monthlyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthlyCardLeft: { flexDirection: 'row', alignItems: 'center' },
  monthIconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  monthlyMonthName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  visitFormCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8, marginTop: 16 },
  formInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  formInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#0F172A', outlineStyle: 'none' },
  photoBox: { width: '100%', height: 200, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#2563EB', marginTop: 16, overflow: 'hidden' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
  photoText: { color: '#2563EB', fontWeight: '700', marginTop: 10 },
  pickedImage: { width: '100%', height: '100%' },
  submitVisitBtn: { backgroundColor: '#2563EB', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  submitVisitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  fraudInfoText: { fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 16, lineHeight: 16 },
  leaveGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  leaveGridItem: { width: '32%', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  iconContainer: { marginBottom: 6 },
  leaveGridLabel: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  leaveGridVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  filterRowScroll: { marginBottom: 20 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtnActive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2563EB' },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  filterTextActive: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  leaveCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  leaveHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  blueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginRight: 10 },
  leaveDateText: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  leaveInfoRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  leaveInfoLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  leaveInfoVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  profileHeader: { height: 140, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 25 },
  profileImageContainer: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#F1F5F9' },
  profileImage: { width: '100%', height: '100%' },
  profileInfoSection: { padding: 24, alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  profileSubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  profileSubText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
  profileDetailsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, width: '100%', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, marginBottom: 24 },
  profileDetailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  profileDetailLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  profileDetailVal: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  profileActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 20, padding: 16, width: '100%', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
  profileActionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  toggleOuter: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#2563EB', padding: 2, alignItems: 'flex-end' },
  toggleInner: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 95, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 30, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 12, color: '#94A3B8', marginTop: 6, fontWeight: '700' },
  navActive: { color: '#3B82F6', fontWeight: '900' },
  visitHeader: { padding: 12, paddingTop: 40, paddingBottom: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  visitHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  visitBackBtn: { marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  visitHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  visitHeaderBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  visitToggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 15, padding: 5 },
  visitTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  visitTabActive: { backgroundColor: '#fff' },
  visitTabText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 13 },
  visitTabTextActive: { color: '#2563EB' },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  formIconBg: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  formSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  historyContainer: { marginTop: 5 },
  historyCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderTopWidth: 5 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between' },
  historyInfo: { flex: 1, marginRight: 15 },
  historyClient: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  historyPurpose: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  historyTimeRow: { flexDirection: 'row', alignItems: 'center' },
  historyTime: { fontSize: 12, color: '#94A3B8', marginLeft: 6 },
  historyThumb: { width: 80, height: 80, borderRadius: 15 },
  historyThumbPlaceholder: { width: 80, height: 80, borderRadius: 15, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  historyFooter: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row' },
  locBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  locBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '700', marginLeft: 5 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '90%', borderRadius: 32, padding: 24, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 54, marginBottom: 16 },
  successMessageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
  successMessageText: { color: '#16A34A', fontSize: 14, fontWeight: '700' },
  submitLeaveBtn: { backgroundColor: '#2563EB', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitLeaveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  addLeaveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#2563EB' },
  addLeaveText: { color: '#2563EB', fontWeight: '700', fontSize: 13, marginRight: 6 },
  loginContainer: { flex: 1, backgroundColor: '#F1F5F9', justifyContent: 'center', padding: 25 },
  loginCard: { backgroundColor: '#fff', borderRadius: 32, padding: 32, elevation: 12 },
  loginLogo: { width: 84, height: 84, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24, alignSelf: 'center' },
  loginTitle: { fontSize: 30, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  loginSub: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 32, marginTop: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 58, marginBottom: 16 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0F172A', outlineStyle: 'none' },
  loginBtn: { backgroundColor: '#2563EB', height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  alertContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 25,
  },
  alertIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  alertBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
