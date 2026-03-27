import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Droplets, Wind, MessageSquare, X, Send, User, CheckCircle2, Thermometer, Clock, ClipboardList, Stethoscope, Calendar, Video } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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

const rand = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(1);

function generateVitalPoint() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    heartRate: rand(68, 88),
    oxygen: rand(95, 100),
    sugar: rand(85, 120),
    temp: rand(97.5, 99.5),
  };
}

export function PatientDashboard() {
  const { user, token, logout } = useAuth();
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const navigate = useNavigate();
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: 'ai', text: "Hello! I'm your AI Triage Assistant. How are you feeling right now?", time: '10:31 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const [formData, setFormData] = useState({
    age: '', gender: '', bloodType: '', sugarLevel: '', oxygenLevel: '', weight: '', height: ''
  });

  // Real-time vitals
  const [liveVitals, setLiveVitals] = useState(() => Array.from({ length: 8 }, () => generateVitalPoint()));
  const [latestVital, setLatestVital] = useState({ heartRate: 75, oxygen: 98, sugar: 105, temp: 98.6 });

  useEffect(() => {
    if (!intakeComplete) return;
    if (token) {
      fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => {
          if (Array.isArray(data)) setUpcomingAppts(data.filter((a: Appointment) => new Date(a.dateTime) >= new Date() && a.status !== 'rejected'));
        }).catch(() => {});
    }
    const interval = setInterval(() => {
      const point = generateVitalPoint();
      setLiveVitals(prev => [...prev.slice(1), point]);
      setLatestVital({ heartRate: point.heartRate, oxygen: point.oxygen, sugar: point.sugar, temp: point.temp });
    }, 2500);
    return () => clearInterval(interval);
  }, [intakeComplete, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIntakeComplete(true);
  };

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setChatMessages(prev => [...prev, { from: 'user', text: chatInput, time: now }]);
    setChatInput('');
    setTimeout(() => {
      const responses = [
        "I've noted your symptoms. Based on your current vitals, your acuity is assessed as 'Medium'. A doctor will review soon.",
        "Your heart rate is stable. I recommend staying hydrated and resting. Would you like to schedule a video consultation?",
        "I can see your O2 levels are healthy. If you experience any shortness of breath, please call emergency services immediately.",
        "Thank you for sharing. I've updated your triage record. Your estimated wait time for a doctor review is ~8 minutes.",
      ];
      const aiNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setChatMessages(prev => [...prev, { from: 'ai', text: responses[Math.floor(Math.random() * responses.length)], time: aiNow }]);
    }, 1200);
  }, [chatInput]);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const patientName = user?.fullName || localStorage.getItem('patientName') || 'Patient';
  const initials = patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // ─── SINGLE-PAGE INTAKE FORM ─────────────────────────────────────────────────
  if (!intakeComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 relative z-10 border border-slate-100">
          {/* Header */}
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/25 mr-4">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Health Intake Form</h2>
              <p className="text-slate-500 text-sm mt-0.5">Fill in your details so we can monitor your health accurately</p>
            </div>
          </div>

          <form onSubmit={handleIntakeSubmit} className="space-y-7">
            {/* Section 1: Personal Details */}
            <div>
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" /> Personal Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
                  <input
                    required type="number" name="age" value={formData.age} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                    placeholder="e.g. 34"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                  <select
                    required name="gender" value={formData.gender} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section 2: Physical Metrics */}
            <div>
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" /> Physical Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Height (cm)</label>
                  <input
                    required type="number" name="height" value={formData.height} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                    placeholder="e.g. 175"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg)</label>
                  <input
                    required type="number" name="weight" value={formData.weight} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                    placeholder="e.g. 70"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section 3: Vitals */}
            <div>
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center">
                <Heart className="w-4 h-4 mr-2" /> Initial Vitals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Type</label>
                  <select
                    required name="bloodType" value={formData.bloodType} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sugar Level (mg/dL)</label>
                  <input
                    required type="number" name="sugarLevel" value={formData.sugarLevel} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                    placeholder="e.g. 95"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current O₂ Level (%)</label>
                  <input
                    required type="number" name="oxygenLevel" value={formData.oxygenLevel} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                    placeholder="e.g. 98"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex justify-center items-center text-sm mt-2"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete Intake & Open Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── PATIENT DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 lg:pb-0">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">CareConnect</span>
        </div>
        <nav className="hidden md:flex items-center space-x-1">
          <Link to="/find-doctors" className="flex items-center text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">
            <Stethoscope className="w-4 h-4 mr-1.5" /> Find Doctors
          </Link>
          <Link to="/patient/calendar" className="flex items-center text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">
            <Calendar className="w-4 h-4 mr-1.5" /> My Calendar
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <button onClick={handleSignOut} className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            Sign Out
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm text-sm">
            {initials}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Hello, {patientName}! 👋</h1>
            <p className="text-indigo-100 max-w-lg mb-6">Your vitals are being monitored in real-time. AI Triage updates every 2.5 seconds.</p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg flex items-center border border-white/10">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-300" /> Vitals Streaming
              </div>
              <a href="/consultation/demo-room" className="bg-white text-indigo-600 px-5 py-2 rounded-lg font-bold flex items-center hover:bg-slate-50 transition-colors shadow-sm">
                Join Pending Video Call
              </a>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppts.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center"><Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Upcoming Appointments</h2>
              <Link to="/patient/calendar" className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {upcomingAppts.slice(0, 3).map(a => (
                <div key={a._id} className={`flex items-center justify-between p-3 rounded-2xl border ${a.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{a.doctor.fullName}</div>
                    <div className="text-xs text-slate-500 flex items-center mt-0.5"><Clock className="w-3 h-3 mr-1" />{new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  {a.status === 'approved' && a.channelName ? (
                    <Link to={`/consultation/${a.channelName}`} className="flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-colors"><Video className="w-3 h-3 mr-1" /> Join</Link>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vitals Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <VitalCard icon={<Heart className="w-6 h-6" />} label="Heart Rate" value={`${latestVital.heartRate}`} unit="bpm" color="rose" />
          <VitalCard icon={<Wind className="w-6 h-6" />} label="Oxygen (SpO₂)" value={`${latestVital.oxygen}`} unit="%" color="blue" />
          <VitalCard icon={<Droplets className="w-6 h-6" />} label="Sugar Level" value={`${latestVital.sugar}`} unit="mg/dL" color="amber" />
          <VitalCard icon={<Thermometer className="w-6 h-6" />} label="Temperature" value={`${latestVital.temp}`} unit="°F" color="emerald" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Heart Rate & O₂</h2>
              <span className="text-xs text-emerald-600 font-semibold flex items-center animate-pulse"><Clock className="w-3.5 h-3.5 mr-1" /> Live</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveVitals} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[60, 110]} />
                  <RechartsTooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="heartRate" isAnimationActive={false} stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHR)" dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} name="Heart Rate" />
                  <Area type="monotone" dataKey="oxygen" isAnimationActive={false} stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorO2)" dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} name="O₂ %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Sugar & Temperature</h2>
              <span className="text-xs text-emerald-600 font-semibold flex items-center animate-pulse"><Clock className="w-3.5 h-3.5 mr-1" /> Live</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveVitals} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="sugar" isAnimationActive={false} stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Sugar (mg/dL)" />
                  <Line type="monotone" dataKey="temp" isAnimationActive={false} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Temp (°F)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {/* AI TRIAGE CHAT */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 pointer-events-none scale-95'}`}>
        <div className="w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3"><Activity className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-sm">AI Triage Assistant</h3><p className="text-xs text-indigo-200">Online & ready</p></div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-indigo-200 transition-colors p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${msg.from === 'ai' ? 'bg-indigo-100 text-indigo-900 rounded-tl-sm self-start' : 'bg-white border border-slate-200 text-slate-800 rounded-tr-sm self-end'}`}>{msg.text}</div>
                <div className={`text-xs text-slate-400 ${msg.from === 'ai' ? 'self-start ml-1' : 'self-end mr-1'}`}>{msg.time}</div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Type your symptoms..." className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              <button onClick={handleSendChat} className="absolute right-1.5 top-1.5 w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 shadow-sm transition-all duration-200"><Send className="w-4 h-4 ml-0.5" /></button>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setIsChatOpen(true)} className={`fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 transition-all duration-300 z-40 ${isChatOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}`}>
        <MessageSquare className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    </div>
  );
}

function VitalCard({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    rose: { bg: 'bg-rose-100', text: 'text-rose-500', ring: 'ring-rose-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-500', ring: 'ring-blue-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-500', ring: 'ring-amber-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-500', ring: 'ring-emerald-200' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center ring-1 ${c.ring}`}>
      <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center mr-4 ${c.text}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums transition-all duration-500">{value} <span className="text-sm font-medium text-slate-500">{unit}</span></p>
      </div>
    </div>
  );
}
