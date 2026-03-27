import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorAuth } from './pages/DoctorAuth';
import { VideoConsultation } from './pages/VideoConsultation';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';

function PatientSignupPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Patient Portal Signup</h2>
        <p className="text-slate-600 mb-6">Patient signup flow will be implemented here.</p>
        <a href="/" className="text-indigo-600 font-semibold hover:text-indigo-700">← Back to Home</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/signup" element={<PatientSignupPlaceholder />} />
        <Route path="/doctor/signup" element={<DoctorAuth />} />
        <Route 
          path="/doctor/dashboard" 
          element={
            <RoleProtectedRoute allowedRole="doctor">
              <DoctorDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route path="/consultation/:channelName" element={<VideoConsultation />} />
      </Routes>
    </Router>
  );
}

export default App;
