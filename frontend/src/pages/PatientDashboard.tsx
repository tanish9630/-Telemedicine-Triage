import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Droplets, Wind, MessageSquare, X, Send, CheckCircle2, Thermometer, Clock, Stethoscope, Calendar, Video, AlertTriangle, Shield, Zap, Info, Settings, Search, Phone, FileText, BookOpen, TrendingUp, Bell, Mic } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { useCallNotification } from '../hooks/useCallNotification';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

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
    heartRate: rand(68, 88), oxygen: rand(95, 100), sugar: rand(85, 120), temp: rand(97.5, 99.5),
  };
}

const HEALTH_TIPS = [
  { icon: '💧', tip: 'Drink at least 8 glasses of water today to stay hydrated.' },
  { icon: '🚶', tip: 'A 30-minute walk can reduce stress and improve heart health.' },
  { icon: '😴', tip: '7-9 hours of sleep is essential for immune system health.' },
  { icon: '🥗', tip: 'Include 5 servings of fruits and vegetables in your daily diet.' },
  { icon: '🧘', tip: 'Practice 10 minutes of mindfulness to reduce cortisol levels.' },
  { icon: '🩺', tip: 'Regular health check-ups can catch issues before they escalate.' },
];

async function callGroqAPI(userMessage: string, patientName: string): Promise<{ text: string; urgencyLevel?: number; specialist?: string; recommendation?: string }> {
  if (!GROQ_KEY) {
    return { text: 'AI assistant is not configured. Please add a Groq API key.' };
  }

  const systemPrompt = `You are CareConnect AI, a medical triage assistant. The patient's name is ${patientName}.
When a patient describes symptoms, always respond with:
1. A compassionate analysis
2. An urgency level (1-5): 1=Mild, 2=Minor, 3=Moderate, 4=Serious, 5=Critical Emergency
3. The recommended medical specialist
4. A brief recommendation

CRITICAL INSTRUCTION: Analyze the language of the user's input. You MUST translate your ENTIRE JSON response (the values for message, specialist, and recommendation) into the EXACT SAME language the user used (e.g., if the user writes in Hindi, respond with Hindi text for those fields). Do NOT translate the JSON keys.

Format your response as JSON:
{
  "message": "Your empathetic response here",
  "urgencyLevel": <1-5>,
  "specialist": "Specialist name",
  "recommendation": "What to do next"
}

For greetings or non-medical questions, just respond normally without the JSON format.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!res.ok) throw new Error('Groq API error');
  const data = await res.json();
  const rawText: string = data.choices?.[0]?.message?.content || '';

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return { text: parsed.message || rawText, urgencyLevel: parsed.urgencyLevel, specialist: parsed.specialist, recommendation: parsed.recommendation };
    } catch { /* fall through */ }
  }
  return { text: rawText };
}

const URGENCY_META: Record<number, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  1: { label: 'Level 1 — Mild', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: <Shield className="w-4 h-4" /> },
  2: { label: 'Level 2 — Minor', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', icon: <Info className="w-4 h-4" /> },
  3: { label: 'Level 3 — Moderate', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: <AlertTriangle className="w-4 h-4" /> },
  4: { label: 'Level 4 — Serious', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', icon: <Zap className="w-4 h-4" /> },
  5: { label: 'Level 5 — Emergency 🚨', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icon: <AlertTriangle className="w-4 h-4" /> },
};

export function PatientDashboard() {
  const { user, token, logout } = useAuth();
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { incomingCall, dismissCall } = useCallNotification();

  const [intakeComplete, setIntakeComplete] = useState(() => localStorage.getItem('intakeComplete') === 'true');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: string; urgencyLevel?: number; specialist?: string; recommendation?: string }[]>([
    { from: 'ai', text: `Hello! 👋 I'm your **Groq AI** health assistant powered by Llama 3.3. Describe your symptoms and I'll analyze your urgency level and recommend the best specialist for you.`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const { isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition({
    onResult: (transcript) => {
      setChatInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    }
  });

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const [intakeData, setIntakeData] = useState({ age: '', gender: '', height: '', weight: '', bloodType: '', sugarLevel: '', oxygenLevel: '' });
  const [liveVitals, setLiveVitals] = useState(() => Array.from({ length: 15 }, generateVitalPoint));
  const [latestVital, setLatestVital] = useState(liveVitals[liveVitals.length - 1]);

  const savedIntake = (() => { try { return JSON.parse(localStorage.getItem('intakeData') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    if (!intakeComplete) return;
    if (token) {
      fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setUpcomingAppts(data.filter((a: Appointment) => new Date(a.dateTime) >= new Date() && a.status !== 'rejected')); }).catch(() => {});
    }
    const interval = setInterval(() => {
      const point = generateVitalPoint();
      setLiveVitals(prev => [...prev.slice(1), point]);
      setLatestVital(point);
    }, 2500);
    const tipInterval = setInterval(() => setTipIndex(i => (i + 1) % HEALTH_TIPS.length), 5000);
    return () => { clearInterval(interval); clearInterval(tipInterval); };
  }, [intakeComplete, token]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isTyping]);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg, time }]);
    setChatInput('');
    setIsTyping(true);
    try {
      const patientName = user?.fullName?.split(' ')[0] || 'there';
      const result = await callGroqAPI(userMsg, patientName);
      setChatMessages(prev => [...prev, { from: 'ai', text: result.text, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), urgencyLevel: result.urgencyLevel, specialist: result.specialist, recommendation: result.recommendation }]);
    } catch {
      setChatMessages(prev => [...prev, { from: 'ai', text: 'Sorry, I couldn\'t reach the AI service. Please check your connection.', time }]);
    } finally { setIsTyping(false); }
  }, [chatInput, user]);

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('intakeComplete', 'true');
    localStorage.setItem('intakeData', JSON.stringify(intakeData));
    setIntakeComplete(true);
  };

  const handleSignOut = () => { localStorage.removeItem('intakeComplete'); localStorage.removeItem('intakeData'); logout(); navigate('/'); };
  const patientName = user?.fullName || 'Patient';
  const initials = patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = localStorage.getItem('patient_avatar_color') || 'from-indigo-500 to-purple-600';

  const NAV_ITEMS = [
    { to: '/patient/dashboard', icon: <Activity className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/find-doctors', icon: <Stethoscope className="w-5 h-5" />, label: 'Doctors' },
    { to: '/patient/calendar', icon: <Calendar className="w-5 h-5" />, label: 'Calendar' },
    { to: '/patient/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  if (!intakeComplete) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden transition-colors">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 dark:bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 relative z-10 border border-slate-100 dark:border-white/10 transition-colors">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/25 mr-4"><FileText className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Health Intake Form</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Fill in your details so we can monitor your health accurately</p>
            </div>
          </div>
          <form onSubmit={handleIntakeSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Age</label><input required type="number" value={intakeData.age} onChange={e => setIntakeData({...intakeData, age: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="e.g. 34" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gender</label><select required value={intakeData.gender} onChange={e => setIntakeData({...intakeData, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Height (cm)</label><input required type="number" value={intakeData.height} onChange={e => setIntakeData({...intakeData, height: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="175" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Weight (kg)</label><input required type="number" value={intakeData.weight} onChange={e => setIntakeData({...intakeData, weight: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="70" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Blood Type</label><select required value={intakeData.bloodType} onChange={e => setIntakeData({...intakeData, bloodType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"><option value="">Select</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b}>{b}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sugar Level (mg/dL)</label><input required type="number" value={intakeData.sugarLevel} onChange={e => setIntakeData({...intakeData, sugarLevel: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="95" /></div>
              <div className="col-span-2"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">O₂ Level (%)</label><input required type="number" value={intakeData.oxygenLevel} onChange={e => setIntakeData({...intakeData, oxygenLevel: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="98" /></div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex justify-center items-center text-sm">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Intake & Open Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors flex flex-col">
      {/* ── TOP NAV ── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">CareConnect</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center bg-slate-50 dark:bg-white/5 rounded-2xl p-1 space-x-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800'}`}>
                {item.icon}<span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-2">
          {/* AI Button in nav */}
          <button onClick={() => setIsChatOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-indigo-600/30 hover:opacity-90 transition-all relative">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:block">AI Chat</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </button>
          <ThemeToggle />
          <button onClick={handleSignOut} className="hidden md:block text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors px-2">Sign Out</button>
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>{initials}</div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex items-center justify-around px-4 py-2 shadow-xl">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {item.icon}
              <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setIsChatOpen(true)} className="flex flex-col items-center py-1 px-3 rounded-xl text-indigo-600 dark:text-indigo-400 relative">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">AI</span>
          <span className="absolute top-0 right-2 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 flex-1 w-full pb-20 md:pb-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-32 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Hello, {patientName.split(' ')[0]}! 👋</h1>
            <p className="text-indigo-100 text-sm mb-5">Your health vitals are streaming live. AI Assistant is ready.</p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center border border-white/10 text-xs"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-300" /> Vitals Streaming</div>
              <button onClick={() => setIsChatOpen(true)} className="bg-white text-indigo-700 font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-indigo-50 transition-colors flex items-center shadow-sm"><MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open AI Triage</button>
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
              { icon: <MessageSquare className="w-6 h-6" />, label: 'AI Assistant', desc: 'Symptom checker', to: '#', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', onClick: () => setIsChatOpen(true) },
              { icon: <Phone className="w-6 h-6" />, label: 'Emergency', desc: 'Call 112', to: 'tel:112', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
              { icon: <FileText className="w-6 h-6" />, label: 'Health Records', desc: 'View history', to: '/patient/calendar', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { icon: <Settings className="w-6 h-6" />, label: 'Settings', desc: 'Edit preferences', to: '/patient/settings', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-white/5' },
            ].map(item => (
              item.onClick
                ? <button key={item.label} onClick={item.onClick} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group">
                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </button>
                : <Link key={item.label} to={item.to} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </Link>
            ))}
          </div>
        </div>

        {/* Vitals Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <VitalCard icon={<Heart className="w-5 h-5" />} label="Heart Rate" value={`${latestVital.heartRate}`} unit="bpm" color="rose" />
          <VitalCard icon={<Wind className="w-5 h-5" />} label="SpO₂" value={`${latestVital.oxygen}`} unit="%" color="blue" />
          <VitalCard icon={<Droplets className="w-5 h-5" />} label="Blood Sugar" value={`${latestVital.sugar}`} unit="mg/dL" color="amber" />
          <VitalCard icon={<Thermometer className="w-5 h-5" />} label="Temperature" value={`${latestVital.temp}`} unit="°F" color="emerald" />
        </div>

        {/* Charts + Health Tip + Appointments */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Heart Rate & O₂</h2>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center animate-pulse"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5" /> Live</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveVitals} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                      <linearGradient id="o2Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[60, 110]} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="heartRate" isAnimationActive={false} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" name="Heart Rate" />
                    <Area type="monotone" dataKey="oxygen" isAnimationActive={false} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#o2Grad)" name="SpO₂ %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Sugar & Temperature</h2>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center animate-pulse"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5" /> Live</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liveVitals} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="sugar" isAnimationActive={false} stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Sugar (mg/dL)" />
                    <Line type="monotone" dataKey="temp" isAnimationActive={false} stroke="#10b981" strokeWidth={2.5} dot={false} name="Temp (°F)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
                  { label: 'Heart Rate', value: latestVital.heartRate, min: 60, max: 100, unit: 'bpm', color: '#f43f5e' },
                  { label: 'Blood Oxygen', value: latestVital.oxygen, min: 94, max: 100, unit: '%', color: '#3b82f6' },
                  { label: 'Blood Sugar', value: latestVital.sugar, min: 70, max: 140, unit: 'mg/dL', color: '#f59e0b' },
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

      {/* ── AI CHAT PANEL ── */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 pointer-events-none scale-95'}`}>
        <div className="w-80 md:w-[400px] h-[560px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mr-3 flex-shrink-0"><Activity className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-sm">Groq AI Assistant</h3>
                <p className="text-xs text-indigo-200 flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />Powered by Groq · Llama 3.3</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto space-y-4 transition-colors">
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <div className={`p-3 rounded-2xl text-sm max-w-[90%] shadow-sm ${msg.from === 'ai' ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-sm self-start' : 'bg-indigo-600 text-white rounded-tr-sm self-end'}`}>
                  {msg.text}
                  {msg.urgencyLevel && URGENCY_META[msg.urgencyLevel] && (
                    <div className={`mt-3 rounded-xl border p-3 ${URGENCY_META[msg.urgencyLevel].bg} ${URGENCY_META[msg.urgencyLevel].border}`}>
                      <div className={`flex items-center font-bold text-xs mb-1.5 ${URGENCY_META[msg.urgencyLevel].color}`}>
                        {URGENCY_META[msg.urgencyLevel].icon}<span className="ml-1.5">{URGENCY_META[msg.urgencyLevel].label}</span>
                      </div>
                      {msg.specialist && <p className={`text-xs font-semibold mb-1 ${URGENCY_META[msg.urgencyLevel].color}`}>🩺 Recommended: {msg.specialist}</p>}
                      {msg.recommendation && <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{msg.recommendation}</p>}
                      <Link to="/find-doctors" onClick={() => setIsChatOpen(false)} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors">Book Appointment →</Link>
                    </div>
                  )}
                </div>
                <div className={`text-[10px] text-slate-400 ${msg.from === 'ai' ? 'self-start ml-1' : 'self-end mr-1'}`}>{msg.time}</div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm self-start w-fit">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 transition-colors">
            <div className="relative flex items-center">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder={isListening ? "Listening..." : "Describe your symptoms..."}
                className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-full py-3 pl-4 ${hasRecognitionSupport ? 'pr-24' : 'pr-12'} text-sm outline-none focus:ring-1 transition-all text-slate-900 dark:text-white ${isListening ? 'border-rose-400 focus:border-rose-400 ring-rose-400/20 ring-4' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500'}`} />
              
              <div className="absolute right-1.5 flex items-center space-x-1">
                {hasRecognitionSupport && (
                  <button 
                    onClick={toggleListening} 
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title={isListening ? "Stop listening" : "Start voice typing"}
                  >
                    {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <button onClick={handleSendChat} disabled={!chatInput.trim() && !isListening} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${chatInput.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}>
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">Powered by Groq AI · Not a substitute for medical advice</p>
          </div>
        </div>
      </div>

      {/* FAB when chat closed (mobile) */}
      <button onClick={() => setIsChatOpen(true)} className={`fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center text-white hover:scale-110 transition-all duration-300 z-40 md:z-40 ${isChatOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}`}>
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse flex items-center justify-center text-white text-[9px] font-bold">AI</span>
      </button>
    </div>
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
