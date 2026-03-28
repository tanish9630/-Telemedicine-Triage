import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Droplets, Moon, MessageSquare, X, Send, CheckCircle2, Thermometer, Clock, Stethoscope, Calendar, Video, AlertTriangle, Shield, Zap, Info, Settings, Search, Phone, FileText, BookOpen, TrendingUp, Bell, Mic, Plus } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  const [intakeComplete, setIntakeComplete] = useState(() => localStorage.getItem('intakeComplete') === 'true');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: string; urgencyLevel?: number; specialist?: string; recommendation?: string }[]>([
    { from: 'ai', text: `Hello! 👋 I'm your **Groq AI** health assistant powered by Llama 3.3. Describe your symptoms and I'll analyze your urgency level and recommend the best specialist for you.`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const { isListening, isTranscribing, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition({
    groqApiKey: GROQ_KEY,
    onResult: (transcript) => {
      setChatInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    }
  });

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const [intakeData, setIntakeData] = useState({ age: '', gender: '', height: '', weight: '', bloodType: '', sugarLevel: '', oxygenLevel: '' });
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
        setWeeklyVitals(data);
        if (data.length > 0) setTodayVitals(data[data.length - 1]);
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
    if (!intakeComplete) return;
    fetchVitals();
    if (token) {
      fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setUpcomingAppts(data.filter((a: Appointment) => new Date(a.dateTime) >= new Date() && a.status !== 'rejected')); }).catch(() => {});
    }
    const tipInterval = setInterval(() => setTipIndex(i => (i + 1) % HEALTH_TIPS.length), 5000);
    return () => { clearInterval(tipInterval); };
  }, [intakeComplete, token, fetchVitals]);

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
    <>


      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 flex-1 w-full pb-20 md:pb-6">
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

      {/* ── AI CHAT PANEL ── */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsChatOpen(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-white/10 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">CareConnect AI</div>
                  <div className="text-xs text-emerald-500 font-semibold flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                    Powered by Groq · Llama 3.3
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'ai' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] ${msg.from === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.from === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-white/10'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.urgencyLevel && URGENCY_META[msg.urgencyLevel] && (
                      <div className={`mt-2 px-3 py-2 rounded-xl border ${URGENCY_META[msg.urgencyLevel].bg} ${URGENCY_META[msg.urgencyLevel].border} text-xs`}>
                        <div className={`flex items-center font-bold mb-1 ${URGENCY_META[msg.urgencyLevel].color}`}>
                          {URGENCY_META[msg.urgencyLevel].icon}
                          <span className="ml-1">{URGENCY_META[msg.urgencyLevel].label}</span>
                        </div>
                        {msg.specialist && <div className="text-slate-600 dark:text-slate-400">👨‍⚕️ See: <span className="font-semibold">{msg.specialist}</span></div>}
                        {msg.recommendation && <div className="text-slate-600 dark:text-slate-400 mt-0.5 mb-2">💡 {msg.recommendation}</div>}
                        {msg.specialist && (
                          <Link 
                            to={`/find-doctors?specialty=${encodeURIComponent(msg.specialist)}`}
                            className="mt-2 block w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg py-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            Find {msg.specialist}
                          </Link>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center space-x-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors">
              <div className="flex items-end space-x-2">
                <button
                  onClick={toggleListening}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'
                  }`}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                    placeholder="Describe your symptoms..."
                    rows={1}
                    className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                </div>
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isTyping}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {isListening && (
                <p className="text-xs text-rose-500 font-medium mt-2 text-center animate-pulse">🎙 Listening... speak now</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB to open chat (when chat is closed) */}
      <button onClick={() => setIsChatOpen(true)} className={`fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center text-white hover:scale-110 transition-all duration-300 z-40 ${isChatOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}`}>
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse flex items-center justify-center text-white text-[9px] font-bold">AI</span>
      </button>
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
