import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar as CalendarIcon, Users, Settings, Activity, LogOut, Video, AlertTriangle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCallNotification } from '../hooks/useCallNotification';
import { useSocket } from '../context/SocketContext';
import { useState, useEffect, useRef } from 'react';

function NavItem({ icon, label, to, active }: { icon: React.ReactNode; label: string; to: string; active?: boolean }) {
  return (
    <Link to={to} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
      {icon}<span>{label}</span>
    </Link>
  );
}

export function DoctorLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { incomingCall, dismissCall } = useCallNotification();
  const { socket } = useSocket();
  
  const [sosAlert, setSosAlert] = useState<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleSOS = (data: any) => {
      const isNearest = data.nearestDoctorId === user?._id;
      setSosAlert({ ...data, isNearest });

      try {
        if (!audioCtxRef.current) audioCtxRef.current = new window.AudioContext();
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        
        if (!sirenIntervalRef.current) {
          sirenIntervalRef.current = setInterval(() => {
            if (!audioCtxRef.current) return;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
            osc.frequency.linearRampToValueAtTime(440, audioCtxRef.current.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.5);
          }, 600);
        }
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    };

    socket.on('critical_sos_alert', handleSOS);

    return () => {
      socket.off('critical_sos_alert', handleSOS);
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    };
  }, [socket, user]);

  const dismissSOS = () => {
    setSosAlert(null);
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  };

  const doctorName = user?.fullName || localStorage.getItem('doctorName') || 'Doctor';
  const initials = doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { to: '/doctor/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/doctor/calendar', icon: <CalendarIcon className="w-5 h-5" />, label: 'Calendar' },
    { to: '/doctor/patients', icon: <Users className="w-5 h-5" />, label: 'Patients' },
    { to: '/doctor/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 overflow-hidden transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/5 flex flex-col shadow-sm flex-shrink-0 transition-colors hidden md:flex">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CareConnect</span>
              <div className="text-xs text-slate-400 font-medium">Doctor Portal</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => (
            <NavItem 
              key={item.to} 
              icon={item.icon} 
              label={item.label} 
              to={item.to} 
              active={location.pathname === item.to || location.pathname.startsWith(item.to + '/')} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/5 transition-colors">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 mb-2 transition-colors">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{doctorName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">General Practice</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-medium">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Mobile Navigation Header specifically for Doctor (since sidebar is hidden on mobile) */}
        <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">CareConnect</span>
          </div>
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">{initials}</div>
          </div>
        </header>

        {/* Mobile bottom nav for doctors */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex items-center justify-around px-2 py-2 shadow-xl">
           {navItems.map(item => {
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

        {/* Outlet for nested routes nested in flex-1 */}
        <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Incoming Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 p-8 max-w-sm w-full text-center transition-colors">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <Video className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Incoming Video Call</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{incomingCall.callerName}</span> is joining.
            </p>
            <div className="flex gap-3">
              <button onClick={dismissCall} className="flex-1 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm">Dismiss</button>
              <button
                onClick={() => { dismissCall(); navigate(`/consultation/${incomingCall.channelName}`); }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">
                <Video className="w-4 h-4 mr-2" /> Join Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Alert Popup */}
      {sosAlert && (
        <div className="fixed inset-0 bg-rose-900/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/20 animate-pulse pointer-events-none" />
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-rose-900/50 border border-rose-500/30 p-8 max-w-lg w-full text-center relative z-10 animate-bounce-in">
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <AlertTriangle className="w-12 h-12 text-rose-600 dark:text-rose-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-75" />
            </div>
            
            <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-2 tracking-tight uppercase">CRITICAL SOS ALERT</h2>
            <p className="text-slate-800 dark:text-white text-lg font-medium mb-1">
              {sosAlert.message}
            </p>
            {sosAlert.isNearest ? (
              <p className="text-rose-600 dark:text-rose-400 font-bold text-sm bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg mb-6 shadow-inner ring-1 ring-rose-200 dark:ring-rose-500/30">
                You are the nearest available doctor! Immediate action required.
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Broadcast to all online doctors.
              </p>
            )}

            {sosAlert.emergency?.location?.lat !== 0 && (
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl mb-6 text-left border border-slate-100 dark:border-white/10 flex items-start">
                <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Patient Location</div>
                  <div className="text-slate-900 dark:text-white font-medium text-sm">
                    {sosAlert.emergency.location.lat.toFixed(6)}, {sosAlert.emergency.location.lng.toFixed(6)}
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${sosAlert.emergency.location.lat},${sosAlert.emergency.location.lng}`} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline mt-1 inline-block" onClick={(e) => e.stopPropagation()}>Open in Google Maps ↗</a>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={dismissSOS} className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl transition-colors shadow-sm">
                Acknowledge & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
