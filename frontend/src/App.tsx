import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorAuth } from './pages/DoctorAuth';
import { VideoConsultation } from './pages/VideoConsultation';
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientAuth } from './pages/PatientAuth';
import { FindDoctors } from './pages/FindDoctors';
import { PatientCalendar } from './pages/PatientCalendar';
import { DoctorCalendar } from './pages/DoctorCalendar';
import { DoctorPatients } from './pages/DoctorPatients';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/signup" element={<PatientAuth />} />
        <Route
          path="/patient/dashboard"
          element={<RoleProtectedRoute allowedRole="patient"><PatientDashboard /></RoleProtectedRoute>}
        />
        <Route
          path="/find-doctors"
          element={<RoleProtectedRoute allowedRole="patient"><FindDoctors /></RoleProtectedRoute>}
        />
        <Route
          path="/patient/calendar"
          element={<RoleProtectedRoute allowedRole="patient"><PatientCalendar /></RoleProtectedRoute>}
        />
        <Route path="/doctor/signup" element={<DoctorAuth />} />
        <Route
          path="/doctor/dashboard"
          element={<RoleProtectedRoute allowedRole="doctor"><DoctorDashboard /></RoleProtectedRoute>}
        />
        <Route
          path="/doctor/calendar"
          element={<RoleProtectedRoute allowedRole="doctor"><DoctorCalendar /></RoleProtectedRoute>}
        />
        <Route
          path="/doctor/patients"
          element={<RoleProtectedRoute allowedRole="doctor"><DoctorPatients /></RoleProtectedRoute>}
        />
        <Route path="/consultation/:channelName" element={<VideoConsultation />} />
      </Routes>
    </Router>
  );
}

export default App;
