import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  LayoutDashboard, Calendar as CalendarIcon, Users,
  Bell, TrendingUp, TrendingDown,
  Video, Check, X, Clock, Activity, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Appointment {
  _id: string;
  patient: { fullName: string; email: string };
  dateTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  channelName: string | null;
}
interface Analytics {
  totalCounseling: number;
  overallBooking: number;
  newAppointments: number;
  todaySchedule: number;
  todayAppts: Appointment[];
  patients: { fullName: string; email: string }[];
}

const AGE_LABELS = ['8-15','16-20','21-30','31-40','41-50','51-60','60+'];
const BAR_COLORS = ['#6366f1','#818cf8','#a5b4fc','#c7d2fe','#e0e7ff','#6366f1','#818cf8'];

const genLive = () => {
  const now = new Date();
  return {
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    consultations: Math.floor(Math.random() * 5),
    triaged: Math.floor(Math.random() * 8),
  };
};

export function DoctorDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [requests, setRequests] = useState<Appointment[]>([]);
  const [liveData, setLiveData] = useState(() => Array.from({ length: 8 }, () => genLive()));
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [analyticsRes, requestsRes] = await Promise.all([
      fetch(`${API}/appointments/analytics`, { headers }),
      fetch(`${API}/appointments/doctor`, { headers }),
    ]);
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    if (requestsRes.ok) {
      const all: Appointment[] = await requestsRes.json();
      setRequests(Array.isArray(all) ? all.filter(a => a.status === 'pending') : []);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => [...prev.slice(1), genLive()]);
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`${API}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const doctorName = user?.fullName || localStorage.getItem('doctorName') || 'Doctor';
  const initials = doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const metrics = [
    { label: 'Total Counseling', value: analytics?.totalCounseling ?? 0, isUp: true },
    { label: 'Overall Booking', value: analytics?.overallBooking ?? 0, isUp: true },
    { label: 'New Appointments', value: analytics?.newAppointments ?? 0, isUp: false },
    { label: "Today's Schedule", value: analytics?.todaySchedule ?? 0, isUp: true },
  ];

  // Fake age distribution seeded by patient count
  const totalPts = analytics?.patients?.length || 0;
  const ageData = AGE_LABELS.map((name, i) => ({
    name, patients: Math.max(0, Math.round(totalPts * [0.05, 0.08, 0.22, 0.28, 0.18, 0.12, 0.07][i]))
  }));

  const todayAppts = analytics?.todayAppts || [];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CareConnect</span>
              <div className="text-xs text-slate-400 font-medium">Doctor Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" to="/doctor/dashboard" active />
          <NavItem icon={<CalendarIcon className="w-5 h-5" />} label="Calendar" to="/doctor/calendar" />
          <NavItem icon={<Users className="w-5 h-5" />} label="Patients" to="/doctor/patients" />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 mb-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{doctorName}</div>
              <div className="text-xs text-slate-500 truncate">General Practice</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-center text-sm text-slate-500 hover:text-rose-600 py-2 rounded-xl hover:bg-rose-50 transition-colors font-medium">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Good morning, {doctorName.split(' ')[0]}! 👋</h1>
            <p className="text-xs text-slate-500">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center space-x-3">
            {requests.length > 0 && (
              <div className="relative">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 cursor-pointer transition-colors">
                  <Bell className="w-5 h-5 text-slate-600" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{requests.length}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((m) => (
              <div key={m.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-sm text-slate-500 font-medium mb-1">{m.label}</div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{m.value}</div>
                <div className={`flex items-center text-xs font-semibold ${m.isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {m.isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  Live • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patients by Age Group */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Patients by Age Group</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                      {ageData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Consultation Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Live Consultation Trend</h3>
                <span className="text-xs text-emerald-600 font-semibold flex items-center animate-pulse"><Clock className="w-3 h-3 mr-1" /> Live</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="consultations" isAnimationActive={false} stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#cGrad)" name="Consultations" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Triage Requests */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Triage Requests</h3>
                {requests.length > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{requests.length} pending</span>}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No pending requests.</div>
                ) : requests.map(r => (
                  <div key={r._id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{r.patient.fullName}</div>
                        <div className="text-xs text-slate-500 flex items-center mt-0.5"><Clock className="w-3 h-3 mr-1" />{new Date(r.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5 mb-3">{r.reason}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleStatus(r._id, 'approved')} className="flex-1 flex items-center justify-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors">
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </button>
                      <button onClick={() => handleStatus(r._id, 'rejected')} className="flex-1 flex items-center justify-center py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors">
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Today's Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">{todayAppts.length} {todayAppts.length === 1 ? 'appointment' : 'appointments'} today</p>
              </div>
              <Link to="/doctor/calendar" className="text-sm text-indigo-600 font-semibold hover:underline">View Calendar →</Link>
            </div>
            {todayAppts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No appointments scheduled for today.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Patient</th>
                      <th className="px-5 py-3 text-left">Time</th>
                      <th className="px-5 py-3 text-left">Reason</th>
                      <th className="px-5 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todayAppts.map(a => (
                      <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                              {a.patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{a.patient.fullName}</div>
                              <div className="text-xs text-slate-500">{a.patient.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-medium">
                          {new Date(a.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-slate-500 max-w-xs truncate">{a.reason}</td>
                        <td className="px-5 py-4">
                          {a.channelName && (
                            <Link to={`/consultation/${a.channelName}`}
                              className="flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors w-fit">
                              <Video className="w-3.5 h-3.5 mr-1.5" /> Join Call
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, to, active }: { icon: React.ReactNode; label: string; to: string; active?: boolean }) {
  return (
    <Link to={to} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      {icon}<span>{label}</span>
    </Link>
  );
}
