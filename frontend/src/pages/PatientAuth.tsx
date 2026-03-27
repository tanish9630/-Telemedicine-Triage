import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Users, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Video, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: <Activity className="w-5 h-5" />, title: "Real-Time Monitoring", desc: "Track your vitals live with AI-powered analytics." },
  { icon: <Video className="w-5 h-5" />, title: "Video Consultations", desc: "Connect with doctors instantly via HD video calls." },
  { icon: <ShieldCheck className="w-5 h-5" />, title: "AI Triage", desc: "Get instant symptom analysis and priority assessment." },
  { icon: <Users className="w-5 h-5" />, title: "Care Team", desc: "Access specialist doctors from top Indian hospitals." },
];

export function PatientAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const body = isLogin 
        ? { email, password }
        : { fullName: name, email, password, role: 'patient' };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin && data.role === 'doctor') {
        throw new Error('This account is registered as a doctor. Please use the Doctor Portal to sign in.');
      }

      login(data, data.token);
      navigate('/patient/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex font-sans relative overflow-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px] pointer-events-none" />

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 p-16 relative z-10">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mr-3">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">CareConnect AI</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
          Your Health, <br/><span className="text-indigo-600">Monitored in Real-Time</span>
        </h1>
        <p className="text-slate-500 text-lg mb-10 max-w-md">
          India's most advanced telemedicine triage platform. Get instant AI-powered health assessments, live vitals monitoring, and connect with certified doctors — all from your home.
        </p>
        <div className="grid grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">{f.icon}</div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h3>
              <p className="text-slate-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center space-x-3 text-sm text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Trusted by <strong className="text-slate-600">50,000+</strong> patients across India</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
          <div className="lg:hidden flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-sm"><Heart className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-slate-900">CareConnect AI</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isLogin ? 'Sign in to access your health dashboard and live vitals.' : 'Join CareConnect to get AI-powered health assessments.'}
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder="John Doe" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLogin ? 'Sign In to Dashboard' : 'Create Account'} <ArrowRight className="w-5 h-5 ml-2" /></>}
            </button>
          </form>

          <div className="my-6 flex items-center"><div className="flex-1 h-px bg-slate-200" /><span className="px-3 text-xs text-slate-400">{isLogin ? 'New to CareConnect?' : 'Already have an account?'}</span><div className="flex-1 h-px bg-slate-200" /></div>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="w-full py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            {isLogin ? 'Create a Patient Account' : 'Sign In Instead'}
          </button>
        </div>
      </div>
    </div>
  );
}
