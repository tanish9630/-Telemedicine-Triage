import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope, ChevronRight, Loader2, Mail, Lock, User, FileText, Calendar as CalendarIcon, Activity, BarChart3, Users, Video, CheckCircle2, Heart, Briefcase, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SPECIALIZATIONS = [
  { value: 'General Practitioner (OPD)', label: 'General Practitioner (OPD)', icon: '🩺' },
  { value: 'Gynecologist', label: 'Gynecologist', icon: '👩‍⚕️' },
  { value: 'Surgeon', label: 'Surgeon', icon: '🔬' },
  { value: 'Neurologist', label: 'Neurologist', icon: '🧠' },
  { value: 'Psychiatrist', label: 'Psychiatrist / Mentalist', icon: '🧘' },
  { value: 'Cardiologist', label: 'Cardiologist', icon: '❤️' },
  { value: 'Pediatrician', label: 'Pediatrician', icon: '👶' },
  { value: 'Dermatologist', label: 'Dermatologist', icon: '🩹' },
  { value: 'Orthopedic Surgeon', label: 'Orthopedic Surgeon', icon: '🦴' },
  { value: 'ENT Specialist', label: 'ENT Specialist', icon: '👂' },
  { value: 'Ophthalmologist', label: 'Ophthalmologist', icon: '👁️' },
  { value: 'Oncologist', label: 'Oncologist', icon: '🔭' },
  { value: 'Pulmonologist', label: 'Pulmonologist', icon: '🫁' },
  { value: 'Endocrinologist', label: 'Endocrinologist', icon: '⚗️' },
];

const medicalCouncils = [
  "Andhra Pradesh Medical Council", "Arunachal Pradesh Medical Council", "Assam Medical Council",
  "Bihar Medical Council", "Delhi Medical Council", "Gujarat Medical Council",
  "Haryana Medical Council", "Himachal Pradesh Medical Council", "Jammu & Kashmir Medical Council",
  "Jharkhand Medical Council", "Karnataka Medical Council", "Kerala Medical Council",
  "Madhya Pradesh Medical Council", "Maharashtra Medical Council", "Orissa Council of Medical Registration",
  "Punjab Medical Council", "Rajasthan Medical Council", "Tamil Nadu Medical Council",
  "Uttar Pradesh Medical Council", "West Bengal Medical Council", "Medical Council of India (NMC)"
];

const features = [
  { icon: <BarChart3 className="w-5 h-5" />, title: "Real-Time Analytics", desc: "Live dashboards with patient flow, triage stats, and consultation metrics." },
  { icon: <Video className="w-5 h-5" />, title: "HD Video Consults", desc: "Secure Agora-powered video calls with screen sharing." },
  { icon: <Activity className="w-5 h-5" />, title: "AI-Powered Triage", desc: "Patients are pre-screened and prioritized by our AI before reaching you." },
  { icon: <Users className="w-5 h-5" />, title: "Patient Management", desc: "Complete patient records, vitals history, and appointment scheduling." },
];

export function DoctorAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [council, setCouncil] = useState('');
  const [regYear, setRegYear] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number|null, lng: number|null}>({lat: null, lng: null});
  const [locLoading, setLocLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGetLocation = () => {
    setLocLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      }, () => {
        alert('Location access denied. Please enable GPS.');
        setLocLoading(false);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
      setLocLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const body = isLogin
        ? { email, password }
        : {
            fullName: name, email, password, role: 'doctor',
            registrationNumber: regNumber,
            specialization: specialization,
            medicalCouncil: council,
            yearOfRegistration: regYear,
            location: { lat: coords.lat, lng: coords.lng, address }
          };

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

      if (isLogin && data.role !== 'doctor') {
        throw new Error('This account is not registered as a doctor. Please use the Patient Portal to sign in.');
      }

      login(data, data.token);
      navigate('/doctor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex font-sans relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px] pointer-events-none" />

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 p-16 relative z-10">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mr-3">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">CareConnect AI</span>
          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">DOCTOR</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
          Smarter Practice, <br/><span className="text-indigo-600">Better Patient Outcomes</span>
        </h1>
        <p className="text-slate-500 text-lg mb-10 max-w-md">
          Join India's leading telemedicine network. Access AI-triaged patients, real-time analytics, and seamless video consultations — all verified through the NMC Indian Medical Register.
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
        <div className="mt-10 flex items-center space-x-4 text-sm text-slate-400">
          <div className="flex items-center space-x-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span><strong className="text-slate-600">2,400+</strong> Verified Doctors</span></div>
          <div className="flex items-center space-x-1.5"><Heart className="w-4 h-4 text-rose-500" /><span><strong className="text-slate-600">50K+</strong> Patients Served</span></div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 max-h-[95vh] overflow-y-auto">
          <div className="lg:hidden flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-sm"><Stethoscope className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-slate-900">CareConnect AI</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isLogin ? 'Doctor Portal Login' : 'Doctor Application'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isLogin ? 'Welcome back, Doctor. Your dashboard awaits.' : 'Apply to join the CareConnect AI network.'}
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name (as per NMC)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder="Dr. John Doe" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder="doctor@hospital.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder="••••••••" />
              </div>
            </div>

            {!isLogin && (
              <div className="pt-6 border-t border-slate-100 space-y-5">
                {/* Specialization */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5 text-indigo-500" /> Medical Specialization / Profession</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {SPECIALIZATIONS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSpecialization(s.value)}
                        className={`flex items-center px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                          specialization === s.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-500/30'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        <span className="mr-3 text-lg">{s.icon}</span>
                        <span>{s.label}</span>
                        {specialization === s.value && <CheckCircle2 className="w-4 h-4 ml-auto text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                  {!specialization && <p className="text-xs text-amber-600 mt-1">Please select your specialization</p>}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center mb-1"><ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" /> NMC Verification</h3>
                  <p className="text-xs text-slate-500 mb-4">We verify all doctors against the Indian Medical Register.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input required type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. 12345" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">State Medical Council</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <select required value={council} onChange={e => setCouncil(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none text-slate-700">
                      <option value="">Select Council</option>
                      {medicalCouncils.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year of Registration</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input required type="number" min="1950" max="2026" value={regYear} onChange={e => setRegYear(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="YYYY" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center mb-1"><MapPin className="w-5 h-5 mr-2 text-indigo-600" /> Clinic Address (For SOS Dispatch)</h3>
                  <p className="text-xs text-slate-500 mb-4">Required so patients can quickly reach you in an emergency.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                      <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="123 Care Street, City" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">GPS Coordinates <span className="text-xs text-rose-500 font-normal">(Compulsory for SOS)</span></label>
                      <div className="flex gap-2">
                        <input disabled type="text" value={coords.lat ? `${coords.lat.toFixed(4)}, ${coords.lng?.toFixed(4)}` : 'Coordinates not fetched'} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-sm text-slate-500" />
                        <button type="button" onClick={handleGetLocation} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-3 rounded-xl transition-colors text-sm whitespace-nowrap flex items-center">
                          {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 mr-1.5" />} Fetch GPS
                        </button>
                      </div>
                      {!coords.lat && <p className="text-xs text-amber-600 mt-1">You must fetch GPS to receive SOS alerts</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !specialization)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isLogin ? 'Signing in...' : 'Verifying with NMC Registry...'}</>
                : <>{isLogin ? 'Sign in to Dashboard' : 'Verify & Create Account'}{!isLogin && <ChevronRight className="w-4 h-4 ml-1" />}</>
              }
            </button>
          </form>

          <div className="my-6 flex items-center"><div className="flex-1 h-px bg-slate-200" /><span className="px-3 text-xs text-slate-400">{isLogin ? 'New to CareConnect?' : 'Already verified?'}</span><div className="flex-1 h-px bg-slate-200" /></div>

          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} disabled={loading} className="w-full py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            {isLogin ? 'Apply for Doctor Access' : 'Sign in to existing account'}
          </button>
        </div>
      </div>
    </div>
  );
}
