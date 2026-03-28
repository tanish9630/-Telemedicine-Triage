import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Heart, Droplets, Moon, MessageSquare, X, CheckCircle2, Thermometer, Clock, Stethoscope, Calendar, Video, Settings, Search, Phone, BookOpen, TrendingUp, Bell, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Appointment {
  _id: string;
  doctor: { fullName: string; specialization: string };
  dateTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  channelName: string | null;
}

const HEALTH_TIPS = [
  { icon: '💧', tip: 'Drink at least 8 glasses of water today to stay hydrated.' },
  { icon: '🚶', tip: 'A 30-minute walk can reduce stress and improve heart health.' },
  { icon: '😴', tip: '7-9 hours of sleep is essential for immune system health.' },
  { icon: '🥗', tip: 'Include 5 servings of fruits and vegetables in your daily diet.' },
  { icon: '🧘', tip: 'Practice 10 minutes of mindfulness to reduce cortisol levels.' },
  { icon: '🩺', tip: 'Regular health check-ups can catch issues before they escalate.' },
];

export function PatientDashboard() {
  const { user, token } = useAuth();
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);

  const [tipIndex, setTipIndex] = useState(0);

  const [weeklyVitals, setWeeklyVitals] = useState<any[]>([]);
  const [todayVitals, setTodayVitals] = useState<any>({ heartRate: 0, sleep: 0, sugar: 0, temp: 0 });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [vitalForm, setVitalForm] = useState({ heartRate: '', sleep: '', sugar: '', temp: '' });

  const fetchVitals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/vitals/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWeeklyVitals(data);
          setTodayVitals(data[data.length - 1]);
        } else {
          const mockVitals = [
            { day: 'Mon', heartRate: 72, sleep: 7.5, sugar: 95, temp: 98.4 },
            { day: 'Tue', heartRate: 75, sleep: 6.8, sugar: 98, temp: 98.6 },
            { day: 'Wed', heartRate: 71, sleep: 8.0, sugar: 92, temp: 98.3 },
            { day: 'Thu', heartRate: 74, sleep: 7.2, sugar: 96, temp: 98.5 },
            { day: 'Fri', heartRate: 73, sleep: 7.8, sugar: 94, temp: 98.4 },
            { day: 'Sat', heartRate: 70, sleep: 8.5, sugar: 91, temp: 98.2 },
            { day: 'Sun', heartRate: 72, sleep: 8.1, sugar: 93, temp: 98.3 }
          ];
          setWeeklyVitals(mockVitals);
          setTodayVitals(mockVitals[mockVitals.length - 1]);
        }
      }
    } catch (err) { console.error(err); }
  }, [token]);

  const handleLogVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(vitalForm),
      });
      if (res.ok) {
        setIsLogModalOpen(false);
        setVitalForm({ heartRate: '', sleep: '', sugar: '', temp: '' });
        fetchVitals();
      }
    } catch (err) { console.error(err); }
  };

  const savedIntake = (() => { try { return JSON.parse(localStorage.getItem('intakeData') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    fetchVitals();
    if (token) {
      fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setUpcomingAppts(data.filter((a: Appointment) => new Date(a.dateTime) >= new Date() && a.status !== 'rejected')); }).catch(() => {});
    }
    const tipInterval = setInterval(() => setTipIndex(i => (i + 1) % HEALTH_TIPS.length), 5000);
    return () => { clearInterval(tipInterval); };
  }, [token, fetchVitals]);

  const patientName = user?.fullName || 'Patient';
  const initials = patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = localStorage.getItem('patient_avatar_color') || 'from-indigo-500 to-purple-600';


  return (
    <>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 pb-20 md:pb-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-32 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Hello, {patientName.split(' ')[0]}! 👋</h1>
            <p className="text-indigo-100 text-sm mb-5">Your daily health vitals have been logged. AI Assistant is ready.</p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center border border-white/10 text-xs"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-300" /> Daily Log Saved</div>
              <button onClick={() => setIsLogModalOpen(true)} className="bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-emerald-600 transition-colors flex items-center shadow-sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Log Vitals</button>
              <Link to="/patient/ai-triage" className="bg-white text-indigo-700 font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-indigo-50 transition-colors flex items-center shadow-sm"><MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open AI Triage</Link>
              <Link to="/find-doctors" className="bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold px-4 py-1.5 rounded-lg text-xs hover:bg-white/30 transition-colors flex items-center"><Search className="w-3.5 h-3.5 mr-1.5" /> Find Doctors</Link>
            </div>
          </div>
        </div>

        {/* Profile + Quick Stats */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 transition-colors">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-2xl shadow-lg mb-3`}>{initials}</div>
              <h3 className="font-bold text-slate-900 dark:text-white">{patientName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">CareConnect Patient</p>
              <div className="grid grid-cols-2 gap-2 w-full">
                {savedIntake.age && <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-2 text-center"><div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{savedIntake.age}</div><div className="text-[10px] text-slate-500">Age</div></div>}
                {savedIntake.bloodType && <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-2 text-center"><div className="text-lg font-bold text-rose-600 dark:text-rose-400">{savedIntake.bloodType}</div><div className="text-[10px] text-slate-500">Blood</div></div>}
                {savedIntake.gender && <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-2 text-center"><div className="text-lg font-bold text-violet-600 dark:text-violet-400">{savedIntake.gender === 'Male' ? '♂' : savedIntake.gender === 'Female' ? '♀' : '⚧'}</div><div className="text-[10px] text-slate-500">{savedIntake.gender}</div></div>}
                {savedIntake.height && savedIntake.weight && <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-2 text-center"><div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{(savedIntake.weight / ((savedIntake.height / 100) ** 2)).toFixed(1)}</div><div className="text-[10px] text-slate-500">BMI</div></div>}
              </div>
              <Link to="/patient/settings" className="mt-3 flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"><Settings className="w-3.5 h-3.5 mr-1" /> Edit Profile</Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: <Stethoscope className="w-6 h-6" />, label: 'Find Doctors', desc: 'Book consultation', to: '/find-doctors', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
              { icon: <Calendar className="w-6 h-6" />, label: 'My Calendar', desc: 'View appointments', to: '/patient/calendar', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
              { icon: <MessageSquare className="w-6 h-6" />, label: 'AI Assistant', desc: 'Symptom checker', to: '/patient/ai-triage', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { icon: <Phone className="w-6 h-6" />, label: 'Emergency', desc: 'Call 112', to: 'tel:112', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
              { icon: <FileText className="w-6 h-6" />, label: 'Health Records', desc: 'View history', to: '/patient/calendar', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { icon: <Settings className="w-6 h-6" />, label: 'Settings', desc: 'Edit preferences', to: '/patient/settings', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-white/5' },
            ].map(item => (
              <Link key={item.label} to={item.to} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Vitals Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <VitalCard icon={<Heart className="w-5 h-5" />} label="Avg Heart Rate" value={`${todayVitals.heartRate}`} unit="bpm" color="rose" />
          <VitalCard icon={<Moon className="w-5 h-5" />} label="Sleep Tracker" value={`${todayVitals.sleep}`} unit="hrs" color="blue" />
          <VitalCard icon={<Droplets className="w-5 h-5" />} label="Blood Sugar" value={`${todayVitals.sugar}`} unit="mg/dL" color="amber" />
          <VitalCard icon={<Thermometer className="w-5 h-5" />} label="Temperature" value={`${todayVitals.temp}`} unit="°F" color="emerald" />
        </div>



        {/* Charts + Health Tip + Appointments */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Weekly Heart Rate & Sleep</h2>
              </div>
              <ResponsiveContainer width="100%" height={192}>
                <AreaChart data={weeklyVitals} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                    <linearGradient id="o2Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="heartRate" isAnimationActive={true} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" name="Heart Rate" />
                  <Area type="monotone" dataKey="sleep" isAnimationActive={true} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#o2Grad)" name="Sleep Hrs" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Sugar & Temperature Trends</h2>
              </div>
              <ResponsiveContainer width="100%" height={192}>
                <LineChart data={weeklyVitals} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="sugar" isAnimationActive={true} stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} name="Sugar (mg/dL)" />
                  <Line type="monotone" dataKey="temp" isAnimationActive={true} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} name="Temp (°F)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar: Health Tip + Upcoming */}
          <div className="space-y-5">
            {/* Health Tip Rotator */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-lg" />
              <div className="flex items-center mb-3 relative z-10">
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Daily Health Tip</span>
              </div>
              <div className="relative z-10 transition-all duration-500">
                <div className="text-3xl mb-2">{HEALTH_TIPS[tipIndex].icon}</div>
                <p className="text-sm leading-relaxed text-white/90">{HEALTH_TIPS[tipIndex].tip}</p>
              </div>
              <div className="flex space-x-1 mt-4 relative z-10">
                {HEALTH_TIPS.map((_, i) => (
                  <button key={i} onClick={() => setTipIndex(i)} className={`h-1 rounded-full transition-all ${i === tipIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                ))}
              </div>
            </div>

            {/* Health Status Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-indigo-500" /> Health Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Avg Heart Rate', value: todayVitals.heartRate, min: 60, max: 100, unit: 'bpm', color: '#f43f5e' },
                  { label: 'Sleep Logged', value: todayVitals.sleep, min: 0, max: 12, unit: 'hrs', color: '#3b82f6' },
                  { label: 'Blood Sugar', value: todayVitals.sugar, min: 70, max: 140, unit: 'mg/dL', color: '#f59e0b' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.value} {item.unit}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((item.value - item.min) / (item.max - item.min)) * 100)}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppts.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center"><Bell className="w-4 h-4 mr-2 text-indigo-500" /> Upcoming</h3>
                  <Link to="/patient/calendar" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View all →</Link>
                </div>
                <div className="space-y-2">
                  {upcomingAppts.slice(0, 2).map(a => (
                    <div key={a._id} className={`p-3 rounded-xl border text-xs transition-colors ${a.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'}`}>
                      <div className="font-semibold text-slate-900 dark:text-white">{a.doctor.fullName}</div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center mt-0.5"><Clock className="w-3 h-3 mr-1" />{new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      {a.status === 'approved' && a.channelName && (
                        <Link to={`/consultation/${a.channelName}`} className="mt-2 flex items-center justify-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"><Video className="w-3 h-3 mr-1" /> Join Call</Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Vital Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 w-full max-w-sm p-8 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Today's Vitals</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleLogVitals} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Heart Rate (BPM)</label>
                <input required type="number" value={vitalForm.heartRate} onChange={e => setVitalForm({...vitalForm, heartRate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="e.g. 72" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sleep Logged (hrs)</label>
                <input required type="number" step="0.1" value={vitalForm.sleep} onChange={e => setVitalForm({...vitalForm, sleep: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="e.g. 8.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Blood Sugar (mg/dL)</label>
                <input required type="number" value={vitalForm.sugar} onChange={e => setVitalForm({...vitalForm, sugar: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="e.g. 95" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Temperature (°F)</label>
                <input required type="number" step="0.1" value={vitalForm.temp} onChange={e => setVitalForm({...vitalForm, temp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="e.g. 98.6" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex justify-center items-center text-sm mt-4">
                Save Daily Log
              </button>
            </form>
          </div>
        </div>
      )}


    </>
  );
}
function VitalCard({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  const colorMap: Record<string, { wrapper: string; icon: string }> = {
    rose: { wrapper: 'bg-rose-100 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/20', icon: 'text-rose-500' },
    blue: { wrapper: 'bg-blue-100 dark:bg-blue-500/10 ring-1 ring-blue-200 dark:ring-blue-500/20', icon: 'text-blue-500' },
    amber: { wrapper: 'bg-amber-100 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/20', icon: 'text-amber-500' },
    emerald: { wrapper: 'bg-emerald-100 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/20', icon: 'text-emerald-500' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center ${c.wrapper} transition-colors`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${c.icon}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{value} <span className="text-xs font-medium text-slate-500">{unit}</span></p>
      </div>
    </div>
  );
}
