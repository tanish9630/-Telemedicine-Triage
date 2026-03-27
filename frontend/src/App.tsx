import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorAuth } from './pages/DoctorAuth';
import { VideoConsultation } from './pages/VideoConsultation';
import { PatientDashboard } from './pages/PatientDashboard';

import { PatientAuth } from './pages/PatientAuth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/signup" element={<PatientAuth />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/doctor/signup" element={<DoctorAuth />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/consultation/:channelName" element={<VideoConsultation />} />
      </Routes>
    </Router>
  );
}

export default App;
