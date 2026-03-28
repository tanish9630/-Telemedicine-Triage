import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar as CalendarIcon, Users, Settings, Activity, LogOut, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCallNotification } from '../hooks/useCallNotification';

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
    </div>
  );
}
