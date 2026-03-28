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
import { DoctorProfile } from './pages/DoctorProfile';
import { PatientSettings } from './pages/PatientSettings';
import { DoctorSettings } from './pages/DoctorSettings';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';

import { PatientLayout } from './components/PatientLayout';
import { DoctorLayout } from './components/DoctorLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/patient/signup" element={<PatientAuth />} />
        <Route path="/doctor/signup" element={<DoctorAuth />} />

        {/* Patient Navigation Group */}
        <Route element={<RoleProtectedRoute allowedRole="patient"><PatientLayout /></RoleProtectedRoute>}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/calendar" element={<PatientCalendar />} />
          <Route path="/patient/settings" element={<PatientSettings />} />
        </Route>

        {/* Patient/Visitor Navigation Group */}
        <Route element={<RoleProtectedRoute allowedRole="any"><PatientLayout /></RoleProtectedRoute>}>
          <Route path="/find-doctors" element={<FindDoctors />} />
          <Route path="/doctor/profile/:id" element={<DoctorProfile />} />
        </Route>

        {/* Doctor Navigation Group */}
        <Route element={<RoleProtectedRoute allowedRole="doctor"><DoctorLayout /></RoleProtectedRoute>}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/calendar" element={<DoctorCalendar />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/settings" element={<DoctorSettings />} />
        </Route>

        {/* Shared */}
        <Route path="/consultation/:channelName" element={<VideoConsultation />} />
      </Routes>
    </Router>
  );
}

export default App;
