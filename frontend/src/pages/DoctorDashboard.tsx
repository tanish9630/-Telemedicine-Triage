import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Bell, TrendingUp, TrendingDown,
  Video, Check, X, Clock, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
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



export function DoctorDashboard() {
  const { user, token } = useAuth();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [requests, setRequests] = useState<Appointment[]>([]);
  const [allAppts, setAllAppts] = useState<Appointment[]>([]);
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
      setAllAppts(Array.isArray(all) ? all : []);
      setRequests(Array.isArray(all) ? all.filter(a => a.status === 'pending') : []);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await fetch(`${API}/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const doctorName = user?.fullName || localStorage.getItem('doctorName') || 'Doctor';

  const metrics = [
    { label: 'Total Counseling', value: analytics?.totalCounseling ?? 0, isUp: true },
    { label: 'Overall Booking', value: analytics?.overallBooking ?? 0, isUp: true },
    { label: 'New Appointments', value: analytics?.newAppointments ?? 0, isUp: false },
    { label: "Today's Schedule", value: analytics?.todaySchedule ?? 0, isUp: true },
  ];

  // Real consultations per weekday from approved appointments
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const consultationsByDay = DAY_LABELS.map(day => ({ day, consultations: 0 }));
  allAppts
    .filter(a => a.status === 'approved')
    .forEach(a => {
      const d = new Date(a.dateTime).getDay();
      consultationsByDay[d].consultations += 1;
    });

  // Age distribution
  const totalPts = analytics?.patients?.length || 0;
  const ageData = AGE_LABELS.map((name, i) => ({
    name, patients: Math.max(0, Math.round(totalPts * [0.05, 0.08, 0.22, 0.28, 0.18, 0.12, 0.07][i]))
  }));

  const todayAppts = analytics?.todayAppts || [];

  return (
    <div className="flex flex-col h-full min-h-0">
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Good morning, {doctorName.split(' ')[0]}! 👋</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {requests.length > 0 && (
              <div className="relative">
                <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{requests.length}</span>
              </div>
            )}
          </div>
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((m) => (
              <div key={m.label} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{m.label}</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{m.value}</div>
                <div className={`flex items-center text-xs font-semibold ${m.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {m.isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  Live • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patients by Age Group */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Patients by Age Group</h3>
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={ageData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backgroundColor: 'var(--tw-prose-bg)' }} />
                  <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                    {ageData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Live Consultation Trend */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Consultations This Week</h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">By Day</span>
              </div>
              <ResponsiveContainer width="100%" height={176}>
                <LineChart data={consultationsByDay} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="consultations" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Consultations" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Triage Requests */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col overflow-hidden transition-colors">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between transition-colors">
                <h3 className="font-bold text-slate-900 dark:text-white">Triage Requests</h3>
                {requests.length > 0 && <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">{requests.length} pending</span>}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No pending requests.</div>
                ) : requests.map(r => (
                  <div key={r._id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{r.patient.fullName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5"><Clock className="w-3 h-3 mr-1" />{new Date(r.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-lg px-2.5 py-1.5 mb-3 transition-colors">{r.reason}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleStatus(r._id, 'approved')} className="flex-1 flex items-center justify-center py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl border border-emerald-200 dark:border-emerald-500/20 transition-colors">
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </button>
                      <button onClick={() => handleStatus(r._id, 'rejected')} className="flex-1 flex items-center justify-center py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl border border-rose-200 dark:border-rose-500/20 transition-colors">
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between transition-colors">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Today's Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{todayAppts.length} {todayAppts.length === 1 ? 'appointment' : 'appointments'} today</p>
              </div>
              <Link to="/doctor/calendar" className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View Calendar →</Link>
            </div>
            {todayAppts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No appointments scheduled for today.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide transition-colors">
                    <tr>
                      <th className="px-5 py-3 text-left">Patient</th>
                      <th className="px-5 py-3 text-left">Time</th>
                      <th className="px-5 py-3 text-left">Reason</th>
                      <th className="px-5 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                    {todayAppts.map(a => (
                      <tr key={a._id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs mr-3">
                              {a.patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{a.patient.fullName}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{a.patient.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {new Date(a.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{a.reason}</td>
                        <td className="px-5 py-4 flex items-center gap-2">
                          {a.channelName && (
                            <Link to={`/consultation/${a.channelName}`}
                              className="flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors w-fit shadow-sm">
                              <Video className="w-3.5 h-3.5 mr-1.5" /> Join Call
                            </Link>
                          )}
                          <button onClick={() => handleDelete(a._id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors" title="Delete Appointment">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
  );
}
