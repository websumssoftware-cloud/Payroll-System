import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, 
  StatusBar, ScrollView, Dimensions, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Image, RefreshControl, Alert
} from 'react-native';
import { 
  Clock, Calendar, FileText, Bell, Menu, Sun, CheckCircle2, Navigation, 
  CreditCard, LogOut, Briefcase, Mail, Lock, History, MapPin, 
  ChevronRight, User, CheckCircle, XCircle, Palmtree, 
  ArrowRightCircle, Download, Send, PlusCircle, Leaf, Sprout, 
  Building2, Camera, Plus, Home, LayoutDashboard, Search, Settings, Phone, Info,
  FileDown, Target
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.1.4:5000/api'; 
const MAX_WIDTH = 480;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [attendanceView, setAttendanceView] = useState('Daily');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [clientName, setClientName] = useState('');
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
  const [lStart, setLStart] = useState(new Date());
  const [lEnd, setLEnd] = useState(new Date());
  const [lReason, setLReason] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [visitStartLocation, setVisitStartLocation] = useState(null);

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
    return () => {
      clearInterval(timer);
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchData();
    }
  }, [isLoggedIn, user]);

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
    } catch (e) {}
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const [attRes, leaveRes, visitRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/history/${user._id || user.id}`),
        axios.get(`${API_URL}/leaves/history/${user._id || user.id}`),
        axios.get(`${API_URL}/visits/employee/${user._id || user.id}`)
      ]);
      
      setAttendanceHistory(attRes.data || []);
      setLeaveHistory(leaveRes.data || []);
      setVisitHistory(visitRes.data || []);
      
      const month = new Date().getMonth();
      const monthAtt = (attRes.data || []).filter(a => new Date(a.date).getMonth() === month);
      setAttendance({
        present: monthAtt.filter(a => a.status === 'Present' || a.status === 'Checked In').length,
        absents: 0,
        late: monthAtt.filter(a => a.status === 'Late').length
      });

      const today = new Date().toISOString().split('T')[0];
      const todayAtt = (attRes.data || []).find(a => a.date === today);
      setIsCheckedIn(!!(todayAtt && todayAtt.status === 'Checked In'));

    } catch (err) {
      console.error('Fetch Data Error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return alert('Enter credentials');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      await AsyncStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setToken(res.data.token);
      setIsLoggedIn(true);
    } catch (err) { 
      alert('Login Failed: ' + (err.response?.data?.message || err.message)); 
    } finally { setLoading(false); }
  };

  const handleApplyLeave = async () => {
    if (!lStart || !lReason) return Alert.alert('Error', 'Please fill required fields');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/leaves/apply`, {
        employeeId: user._id || user.id,
        leaveType: lType,
        startDate: lStart.toISOString().split('T')[0],
        endDate: lEnd.toISOString().split('T')[0],
        reason: lReason
      });
      Alert.alert('Success', 'Leave application submitted');
      setShowLeaveModal(false);
      setLStart(new Date()); setLEnd(new Date()); setLReason('');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit application');
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
    if (status !== 'granted') return Alert.alert('Error', 'Camera permission required to take site photos');
    
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
            Alert.alert(
              "Range Alert", 
              `You have moved ${distance.toFixed(2)}km away from the site. Please stay within 1km.`
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
    if (!clientName || !visitPurpose || !visitImage) {
      return Alert.alert('Error', 'Please fill all fields and take a photo');
    }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Location permission required');
      
      const loc = await Location.getCurrentPositionAsync({});
      const visitData = {
        employeeId: user._id || user.id,
        clientName,
        purpose: visitPurpose,
        imageUrl: visitImageBase64 || "",
        location: {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          address: "Site Visit Location"
        }
      };

      await axios.post(`${API_URL}/visits/log`, visitData);
      Alert.alert('Success', 'Visit recorded! Movement tracking started.');
      setClientName('');
      setVisitPurpose('');
      setVisitImage(null);
      setVisitImageBase64(null);
      const startLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setVisitStartLocation(startLoc);
      startTracking(startLoc);
      setActiveTab('Home');
    } catch (err) {
      Alert.alert('Error', 'Failed to log visit: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const type = isCheckedIn ? 'Out' : 'In';
      await axios.post(`${API_URL}/attendance/punch`, {
        employeeId: user._id || user.id,
        type,
        location: locationName
      });
      setIsCheckedIn(!isCheckedIn);
      fetchData();
      alert(`Successfully punched ${type}`);
    } catch (err) {
      alert('Punch Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (monthIndex) => {
    const monthName = new Date(2025, monthIndex).toLocaleString('default', { month: 'long' });
    const monthLogs = attendanceHistory.filter(a => new Date(a.date).getMonth() === monthIndex);
    
    if (monthLogs.length === 0) {
      Alert.alert('No Data', `No attendance records found for ${monthName}`);
      return;
    }

    setLoading(true);
    try {
      const html = `<html><body><h1>Report for ${monthName}</h1></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
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
        <View style={styles.headerTop}>
          <View style={styles.locRow}>
            <View style={styles.locIcon}><MapPin color="#fff" size={18} /></View>
            <View>
              <Text style={styles.locLabel}>Location</Text>
              <Text style={styles.locVal}>{locationName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Bell color="#fff" size={20} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'Arun Kumar'}</Text>
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
            <View style={styles.shiftBadge}><Text style={styles.shiftText}>GENERAL SHIFT</Text></View>
            <Text style={styles.timeText}>
              {currentTime.getHours().toString().padStart(2, '0')}:
              {currentTime.getMinutes().toString().padStart(2, '0')}:
              {currentTime.getSeconds().toString().padStart(2, '0')} AM
            </Text>
          </View>

          <View style={styles.btnRow}>
            {isCheckedIn && (
              <TouchableOpacity style={styles.breakBtn}>
                <Text style={styles.breakBtnText}>Break</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.punchBtn, { backgroundColor: isCheckedIn ? '#EF4444' : '#2563EB' }]} 
              onPress={handlePunch}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.punchBtnText}>{isCheckedIn ? 'Check Out' : 'Check In'}</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statCircle}><Clock color="#2563EB" size={16} /></View>
              <Text style={styles.statVal}>10:00 AM</Text>
              <Text style={styles.statLabel}>Check In</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statCircle}><Clock color="#2563EB" size={16} /></View>
              <Text style={styles.statVal}>06:30 PM</Text>
              <Text style={styles.statLabel}>Check Out</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statCircle}><Clock color="#2563EB" size={16} /></View>
              <Text style={styles.statVal}>00:00:00</Text>
              <Text style={styles.statLabel}>Working HR's</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.attendanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance for this Month</Text>
          <View style={styles.monthBadge}>
            <Text style={styles.monthText}>{new Date().toLocaleString('default', { month: 'short' }).toUpperCase()}</Text><Calendar color="#2563EB" size={14} />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.gridItem, { backgroundColor: '#DCFCE7', borderTopColor: '#22C55E' }]}>
            <Text style={[styles.gridLabel, { color: '#166534' }]}>Present</Text>
            <Text style={[styles.gridVal, { color: '#15803D' }]}>{attendance.present}</Text>
          </View>
          <View style={[styles.gridItem, { backgroundColor: '#FEE2E2', borderTopColor: '#EF4444' }]}>
            <Text style={[styles.gridLabel, { color: '#991B1B' }]}>Absents</Text>
            <Text style={[styles.gridVal, { color: '#B91C1C' }]}>{attendance.absents}</Text>
          </View>
          <View style={[styles.gridItem, { backgroundColor: '#FEF3C7', borderTopColor: '#F59E0B' }]}>
            <Text style={[styles.gridLabel, { color: '#92400E' }]}>Late in</Text>
            <Text style={[styles.gridVal, { color: '#B45309' }]}>{attendance.late}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.requestBtnOuter} onPress={() => setActiveTab('Visits')}>
        <View style={styles.requestBtnInner}>
          <MapPin color="#2563EB" size={22} /><Text style={styles.requestBtnText}>Record Site Visit</Text>
        </View>
      </TouchableOpacity>
      <View style={{height: 100}} />
    </ScrollView>
  );

  const renderAttendance = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('Home')}><ChevronRight color="#000" size={24} style={{transform: [{rotate: '180deg'}]}} /></TouchableOpacity>
        <Text style={styles.subHeaderTitle}>Attendance Details</Text>
      </View>
      
      <View style={styles.listContainer}>
        <View style={styles.viewToggleRow}>
          <TouchableOpacity style={[styles.viewToggleBtn, attendanceView === 'Daily' && styles.viewToggleBtnActive]} onPress={() => setAttendanceView('Daily')}><Text style={[styles.viewToggleText, attendanceView === 'Daily' && styles.viewToggleTextActive]}>Daily Logs</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.viewToggleBtn, attendanceView === 'Monthly' && styles.viewToggleBtnActive]} onPress={() => setAttendanceView('Monthly')}><Text style={[styles.viewToggleText, attendanceView === 'Monthly' && styles.viewToggleTextActive]}>Monthly Cards</Text></TouchableOpacity>
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
                    <View style={styles.attStat}><Text style={[styles.attStatVal, { color: '#16A34A' }]}>{item.punches?.find(p => p.type === 'In')?.time || '-'}</Text><Text style={styles.attStatLabel}>In</Text></View>
                    <View style={styles.attStat}><Text style={[styles.attStatVal, { color: '#166534' }]}>{item.punches?.find(p => p.type === 'Out')?.time || '-'}</Text><Text style={styles.attStatLabel}>Out</Text></View>
                    <View style={styles.attStat}><Text style={[styles.attStatVal, { color: '#166534' }]}>08:30:00</Text><Text style={styles.attStatLabel}>Hrs</Text></View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          ['May', 'April', 'March', 'February', 'January'].map((m, idx) => (
            <TouchableOpacity key={m} style={styles.monthlyCard} onPress={() => generatePDF(4 - idx)}>
              <View style={styles.monthlyCardLeft}><View style={styles.monthIconBg}><Calendar color="#2563EB" size={24} /></View><Text style={styles.monthlyMonthName}>{m} 2025</Text></View>
              <FileDown color="#2563EB" size={24} />
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={{height: 100}} />
    </ScrollView>
  );

  const renderSiteVisit = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.visitHeader}>
        <View style={styles.visitHeaderTop}>
          <TouchableOpacity style={styles.visitBackBtn} onPress={() => setActiveTab('Home')}><ChevronRight color="#fff" size={24} style={{transform: [{rotate: '180deg'}]}} /></TouchableOpacity>
          <Text style={styles.visitHeaderTitle}>Site Visit Tracking</Text>
          <TouchableOpacity style={styles.visitHeaderBtn} onPress={() => setVisitView(visitView === 'New' ? 'History' : 'New')}>
            <History color="#fff" size={20} />
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

            <Text style={styles.formLabel}>Purpose of Visit</Text>
            <View style={styles.formInputBox}>
              <Briefcase color="#64748B" size={20} />
              <TextInput style={styles.formInput} placeholder="e.g. Product Demo" value={visitPurpose} onChangeText={setVisitPurpose} />
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

            <TouchableOpacity style={[styles.submitVisitBtn, {backgroundColor: '#2563EB'}]} onPress={handleSiteVisit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Send color="#fff" size={20} style={{marginRight: 10}} />
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
      <View style={{height: 100}} />
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
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('Home')}><ChevronRight color="#000" size={24} style={{transform: [{rotate: '180deg'}]}} /></TouchableOpacity>
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
              <Text style={styles.leaveGridLabel}>Total Leave</Text>
              <Text style={styles.leaveGridVal}>{leaveStats.total}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.leaveGridLabel, { color: '#2563EB' }]}>Available</Text>
              <Text style={[styles.leaveGridVal, { color: '#2563EB' }]}>{leaveStats.available}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#F0FDFA' }]}>
              <Text style={[styles.leaveGridLabel, { color: '#0D9488' }]}>Applied</Text>
              <Text style={[styles.leaveGridVal, { color: '#0D9488' }]}>{leaveHistory.length}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.leaveGridLabel, { color: '#16A34A' }]}>Approved</Text>
              <Text style={[styles.leaveGridVal, { color: '#16A34A' }]}>{leaveHistory.filter(l => l.status === 'Approved').length}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.leaveGridLabel, { color: '#D97706' }]}>Pending</Text>
              <Text style={[styles.leaveGridVal, { color: '#D97706' }]}>{leaveHistory.filter(l => l.status === 'Pending').length}</Text>
            </View>
            <View style={[styles.leaveGridItem, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.leaveGridLabel, { color: '#DC2626' }]}>Rejected</Text>
              <Text style={[styles.leaveGridVal, { color: '#DC2626' }]}>{leaveHistory.filter(l => l.status === 'Rejected').length}</Text>
            </View>
          </View>

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
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.leaveInfoVal}>Manager</Text>
                  <Text style={styles.leaveInfoLabel}>Approved by Manager</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{height: 100}} />
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

        <TouchableOpacity style={styles.profileActionBtn}>
          <View style={styles.profileActionLeft}>
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}><Settings color="#2563EB" size={20} /></View>
            <Text style={styles.actionText}>Settings</Text>
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
      <View style={{height: 100}} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {activeTab === 'Home' ? renderHome() : 
       activeTab === 'Attendance' ? renderAttendance() : 
       activeTab === 'Visits' ? renderSiteVisit() : 
       activeTab === 'Reports' ? renderReports() : renderProfile()}

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
            <View style={styles.modalInputBox}>
              <Leaf color="#2563EB" size={20} />
              <TextInput style={styles.formInput} value={lType} onChangeText={setLType} placeholder="e.g. Casual Leave" />
            </View>

            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TouchableOpacity style={styles.modalInputBox} onPress={() => setShowStartPicker(true)}>
                  <Calendar color="#2563EB" size={18} />
                  <Text style={[styles.formInput, {paddingTop: 15}]}>{lStart.toLocaleDateString()}</Text>
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
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.formLabel}>End Date</Text>
                <TouchableOpacity style={styles.modalInputBox} onPress={() => setShowEndPicker(true)}>
                  <Calendar color="#2563EB" size={18} />
                  <Text style={[styles.formInput, {paddingTop: 15}]}>{lEnd.toLocaleDateString()}</Text>
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
              </View>
            </View>

            <Text style={styles.formLabel}>Reason</Text>
            <View style={[styles.modalInputBox, {height: 100, alignItems: 'flex-start', paddingTop: 12}]}>
              <FileText color="#2563EB" size={20} />
              <TextInput 
                style={[styles.formInput, {textAlignVertical: 'top'}]} 
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

      <View style={styles.bottomNav}>
        {[
          {t: 'Home', i: Home}, {t: 'Attendance', i: Calendar}, {t: 'Visits', i: MapPin}, {t: 'Reports', i: FileText}, {t: 'Profile', i: User}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  header: { padding: 24, paddingTop: 20, paddingBottom: 64, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locIcon: { backgroundColor: 'rgba(255,255,255,0.25)', padding: 10, borderRadius: 14, marginRight: 12 },
  locLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  locVal: { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.25)', padding: 12, borderRadius: 14 },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 2, borderColor: '#2563EB' },
  welcomeText: { color: '#fff', fontSize: 26, fontWeight: '600' },
  trackingBanner: { flexDirection: 'row', backgroundColor: '#10B981', padding: 12, marginHorizontal: 20, marginTop: -80, borderRadius: 16, alignItems: 'center', justifyContent: 'space-between', zIndex: 100 },
  trackingBannerText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  punchContainer: { paddingHorizontal: 20, marginTop: -44 },
  punchCard: { backgroundColor: '#fff', borderRadius: 30, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 5, marginBottom: 20 },
  toggleBtnActive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', padding: 12, borderRadius: 14 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  toggleTextActive: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  toggleText: { color: '#64748B', fontWeight: '600', marginLeft: 8 },
  timeSection: { alignItems: 'center', marginBottom: 20 },
  shiftBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  shiftText: { color: '#166534', fontSize: 11, fontWeight: '800' },
  timeText: { fontSize: 34, fontWeight: '800', color: '#0F172A' },
  btnRow: { flexDirection: 'row', gap: 14 },
  breakBtn: { flex: 1, borderWidth: 1.5, borderColor: '#2563EB', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  breakBtnText: { color: '#2563EB', fontWeight: '700' },
  punchBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  punchBtnText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, paddingHorizontal: 4 },
  statItem: { alignItems: 'center' },
  statCircle: { backgroundColor: '#F1F5F9', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statVal: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B' },
  attendanceSection: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  monthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  monthText: { color: '#2563EB', fontSize: 12, fontWeight: '800', marginRight: 6 },
  grid: { flexDirection: 'row', gap: 12 },
  gridItem: { flex: 1, padding: 16, borderRadius: 18, borderTopWidth: 5 },
  gridLabel: { fontSize: 12, fontWeight: '800' },
  gridVal: { fontSize: 24, fontWeight: '900', textAlign: 'right', marginTop: 12 },
  requestBtnOuter: { marginHorizontal: 24, marginBottom: 24, borderRadius: 32, padding: 2, backgroundColor: '#2563EB10' },
  requestBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2563EB', padding: 18, borderRadius: 30, backgroundColor: '#fff' },
  requestBtnText: { color: '#2563EB', fontWeight: '800', fontSize: 17, marginLeft: 10 },
  subHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  subHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  listContainer: { padding: 20 },
  listTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  viewToggleRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 24 },
  viewToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
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
  formInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#0F172A' },
  photoBox: { width: '100%', height: 200, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#2563EB', marginTop: 16, overflow: 'hidden' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
  photoText: { color: '#2563EB', fontWeight: '700', marginTop: 10 },
  pickedImage: { width: '100%', height: '100%' },
  submitVisitBtn: { backgroundColor: '#2563EB', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  submitVisitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  fraudInfoText: { fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 16, lineHeight: 16 },
  leaveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  leaveGridItem: { width: (width - 60) / 3, padding: 12, borderRadius: 12 },
  leaveGridLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  leaveGridVal: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
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
  profileHeader: { height: 180, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40 },
  profileImageContainer: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#F1F5F9' },
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
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 90, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 25 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 11, color: '#94A3B8', marginTop: 5, fontWeight: '600' },
  navActive: { color: '#2563EB', fontWeight: '800' },
  visitHeader: { padding: 24, paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  visitHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  visitBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  visitHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  visitHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
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
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#0F172A' },
  loginBtn: { backgroundColor: '#2563EB', height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
