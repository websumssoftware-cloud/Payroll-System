# 🌾 Kusum Farm - Payroll & Attendance System

A premium, comprehensive MERN stack-based Employee Payroll & Attendance Management System featuring real-time location-based geofencing, field visit tracking, auto-computed salaries, and a dedicated mobile application for remote employees.

---

## 🚀 Deployed Links

| Component | Platform | Live URL / Download |
| :--- | :--- | :--- |
| **🌐 Web Admin Panel** | Vercel | *[Configure your Vercel URL here]* |
| **📱 Mobile App (Android APK)** | Expo EAS | [Direct Download APK](https://expo.dev/artifacts/eas/aiXNvi8Y22Jw75vVhYgua9.apk) |

---

## 📸 System Overview & Features

### 1. 🌐 Web Admin Dashboard (React/Vite)
* **Real-time Attendance Feed:** Track who is currently checked-in, their clock-in times, and locations.
* **Live GPS Tracking:** Live map visualization of field executives and workers.
* **Payroll & Salary Slips:** Dynamic salary computation with allowances/deductions and professional PDF salary sheet export.
* **Geofencing Control:** Define range limits (e.g., 1km radius) and capture coordinate violations.

### 2. 📱 Field Employee Mobile App (React Native/Expo)
* **One-Tap Punch In/Out:** Location-verified attendance tracking (prevents proxy logins).
* **Field Visit Logs:** Executives can log client meetings with camera photos and GPS stamps.
* **Monthly Attendance PDF:** Directly download professional attendance reports inside the app.
* **Leave Requests:** Submit, track, and receive real-time leave status updates.

---

## 🛠️ Architecture & Tech Stack

* **Frontend:** React.js, TailwindCSS/Vanilla CSS, Lucide React, Axios, Chart.js/Recharts.
* **Backend:** Node.js, Express.js, MongoDB (Mongoose), Geolocation API.
* **Mobile App:** React Native, Expo, Expo Location, Expo Print (PDF generation), EAS Build.

---

## ⚙️ Local Installation & Development

### Prerequisite
* Node.js (v18+)
* MongoDB Atlas Account or Local MongoDB Community Server

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with your MONGO_URI and PORT
npm start # runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev # runs on http://localhost:5173
```

### 3. Mobile App Setup
```bash
cd mobile-app
npm install --legacy-peer-deps
npx expo start
```

---

## 📁 Repository Structure
```text
├── backend/          # Express API server & database schemas
├── frontend/         # React Admin Dashboard UI
└── mobile-app/       # Expo React Native mobile application
```

---
*Created and maintained by [Vikram7007](https://github.com/Vikram7007).*
