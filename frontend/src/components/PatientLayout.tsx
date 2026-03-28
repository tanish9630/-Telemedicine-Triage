import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, Calendar, Settings, Video, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';
import { useCallNotification } from '../hooks/useCallNotification';
import { useState } from 'react';

export function PatientLayout() {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { incomingCall, dismissCall } = useCallNotification();
  const [sosStatus, setSosStatus] = useState<'idle' | 'loading' | 'active'>('idle');

  const handleSOS = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to trigger an Emergency SOS? This will alert the nearest doctor immediately.")) return;
    
    setSosStatus('loading');
    
    const sendSOS = async (lat: number | null, lng: number | null) => {
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API}/emergency`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ lat, lng })
        });
        if (res.ok) {
          setSosStatus('active');
          alert('SOS Alert Sent! The nearest doctor has been notified.');
          setTimeout(() => setSosStatus('idle'), 10000);
        } else {
          setSosStatus('idle');
          alert('Failed to send SOS. Please call emergency services directly.');
        }
      } catch (err) {
        setSosStatus('idle');
        alert('Network error. Call emergency services directly.');
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendSOS(pos.coords.latitude, pos.coords.longitude),
        () => sendSOS(null, null)
      );
    } else {
      sendSOS(null, null);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('intakeComplete');
    localStorage.removeItem('intakeData');
    logout();
    navigate('/');
  };

  const patientName = user?.fullName || 'Patient';
  const initials = patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = localStorage.getItem('patient_avatar_color') || 'from-indigo-500 to-purple-600';

  const NAV_ITEMS = [
    { to: '/patient/dashboard', icon: <Activity className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/patient/ai-triage', icon: <MessageSquare className="w-5 h-5" />, label: 'AI Triage' },
    { to: '/find-doctors', icon: <Stethoscope className="w-5 h-5" />, label: 'Doctors' },
    { to: '/patient/calendar', icon: <Calendar className="w-5 h-5" />, label: 'Calendar' },
    { to: '/patient/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors flex flex-col">
      {/* ── TOP NAV ── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors">
        <div className="flex items-center space-x-3">
          <Link to="/patient/dashboard" className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Activity className="w-5 h-5 text-white" />
          </Link>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">CareConnect</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center bg-slate-50 dark:bg-white/5 rounded-2xl p-1 space-x-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800'}`}>
                {item.icon}<span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSOS}
            disabled={sosStatus === 'loading' || sosStatus === 'active'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${sosStatus === 'active' ? 'bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-600/30'}`}
          >
            {sosStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{sosStatus === 'active' ? 'Dispatched' : 'SOS Request'}</span>
          </button>

          <ThemeToggle />
          <button onClick={handleSignOut} className="hidden md:block text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors px-2">Sign Out</button>
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>{initials}</div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex items-center justify-around px-4 py-2 shadow-xl">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {item.icon}
              <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col relative pb-20 md:pb-0">
        <Outlet />
      </div>

      <Footer />

      {/* ── INCOMING CALL POPUP ── */}
      {incomingCall && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 p-8 max-w-sm w-full text-center animate-bounce-in transition-colors">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <Video className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Incoming Video Call</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Dr. {incomingCall.callerName}</span> is calling you
            </p>
            <div className="flex gap-3">
              <button onClick={dismissCall} className="flex-1 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm">Decline</button>
              <button onClick={() => { dismissCall(); navigate(`/consultation/${incomingCall.channelName}`); }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">
                <Video className="w-4 h-4 mr-2" /> Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
