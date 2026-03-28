import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, User, Lock, Bell, Shield, Trash2, Save, CheckCircle2,
  Palette, Settings, Briefcase, Clock, Languages,
  LayoutDashboard, Calendar, Users
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-slate-600 to-slate-800',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-violet-600 to-purple-700',
];

const SPECIALIZATIONS = [
  'General Practitioner (OPD)', 'Gynecologist', 'Surgeon', 'Neurologist',
  'Psychiatrist', 'Cardiologist', 'Pediatrician', 'Dermatologist',
  'Orthopedic Surgeon', 'ENT Specialist', 'Pulmonologist', 'Endocrinologist',
];

export function DoctorSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'professional' | 'availability' | 'notifications' | 'privacy'>('profile');
  const [saved, setSaved] = useState(false);

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(localStorage.getItem('doctor_phone') || '');
  const [bio, setBio] = useState(localStorage.getItem('doctor_bio') || '');
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem('doctor_avatar_color') || AVATAR_COLORS[0]);

  // Professional
  const [specialization, setSpecialization] = useState(user?.specialization || localStorage.getItem('doctor_spec') || '');
  const [languages, setLanguages] = useState(localStorage.getItem('doctor_languages') || 'English, Hindi');
  const [experience, setExperience] = useState(localStorage.getItem('doctor_experience') || '');
  const [hospital, setHospital] = useState(localStorage.getItem('doctor_hospital') || '');
  const [regNumber] = useState(user?.registrationNumber || '');

  // Availability
  const [startTime, setStartTime] = useState(localStorage.getItem('doctor_start') || '09:00');
  const [endTime, setEndTime] = useState(localStorage.getItem('doctor_end') || '17:00');
  const [slotDuration, setSlotDuration] = useState(localStorage.getItem('doctor_slot') || '30');
  const [workDays, setWorkDays] = useState<string[]>(JSON.parse(localStorage.getItem('doctor_days') || '["Mon","Tue","Wed","Thu","Fri"]'));

  // Notifications
  const [newPatientAlerts, setNewPatientAlerts] = useState(localStorage.getItem('doc_notif_patient') !== 'false');
  const [appointmentAlerts, setAppointmentAlerts] = useState(localStorage.getItem('doc_notif_appt') !== 'false');
  const [callAlerts, setCallAlerts] = useState(localStorage.getItem('doc_notif_call') !== 'false');

  const toggleDay = (d: string) => {
    setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = () => {
    localStorage.setItem('doctor_phone', phone);
    localStorage.setItem('doctor_bio', bio);
    localStorage.setItem('doctor_avatar_color', avatarColor);
    localStorage.setItem('doctor_spec', specialization);
    localStorage.setItem('doctor_languages', languages);
    localStorage.setItem('doctor_experience', experience);
    localStorage.setItem('doctor_hospital', hospital);
    localStorage.setItem('doctor_start', startTime);
    localStorage.setItem('doctor_end', endTime);
    localStorage.setItem('doctor_slot', slotDuration);
    localStorage.setItem('doctor_days', JSON.stringify(workDays));
    localStorage.setItem('doc_notif_patient', String(newPatientAlerts));
    localStorage.setItem('doc_notif_appt', String(appointmentAlerts));
    localStorage.setItem('doc_notif_call', String(callAlerts));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'Dr';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'availability', label: 'Availability', icon: <Clock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 sticky top-0 z-40 shadow-sm transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/doctor/dashboard')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Doctor Settings</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your profile & practice</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { to: '/doctor/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
                { to: '/doctor/patients', icon: <Users className="w-4 h-4" />, label: 'Patients' },
                { to: '/doctor/calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
              ].map(n => (
                <Link key={n.to} to={n.to}
                  className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors">
                  {n.icon}<span className="ml-1.5">{n.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 text-center transition-colors">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-2xl mx-auto mb-3 shadow-lg`}>
                {initials}
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{fullName || 'Doctor Name'}</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{specialization || 'Specialization'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{email}</div>
            </div>

            <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold transition-all text-left border-b border-slate-50 dark:border-white/5 last:border-0 ${
                    activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}>
                  <span className="mr-3">{tab.icon}</span>{tab.label}
                  {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-500" /> Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="Dr. Full Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="doctor@hospital.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Hospital / Clinic</label>
                    <input value={hospital} onChange={e => setHospital(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="AIIMS Delhi" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Professional Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
                    placeholder="Brief description of your expertise and approach..." />
                </div>
                <div className="border-t border-slate-100 dark:border-white/10 pt-5">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-indigo-500" /> Avatar Color
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setAvatarColor(c)}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c} transition-all ${avatarColor === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-105'}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Professional */}
            {activeTab === 'professional' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-indigo-500" /> Professional Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Specialization</label>
                    <select value={specialization} onChange={e => setSpecialization(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Years of Experience</label>
                    <input value={experience} onChange={e => setExperience(e.target.value)} type="number"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="e.g. 12" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center"><Languages className="w-4 h-4 mr-1.5" /> Languages Spoken</label>
                    <input value={languages} onChange={e => setLanguages(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="English, Hindi, Tamil" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">NMC Registration #</label>
                    <input value={regNumber} onChange={() => {}} readOnly
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-500 text-sm outline-none cursor-not-allowed"
                      placeholder="Read-only" />
                    <p className="text-xs text-slate-400 mt-1">Registration number cannot be changed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Availability */}
            {activeTab === 'availability' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Availability Settings
                </h2>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                      <button key={d} onClick={() => toggleDay(d)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${workDays.includes(d) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label>
                    <input value={startTime} onChange={e => setStartTime(e.target.value)} type="time"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
                    <input value={endTime} onChange={e => setEndTime(e.target.value)} type="time"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Slot Duration (min)</label>
                    <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                      {['15','20','30','45','60'].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-amber-500" /> Notification Preferences
                </h2>
                {[
                  { label: 'New Patient Requests', desc: 'Get notified when a patient books an appointment', value: newPatientAlerts, set: setNewPatientAlerts },
                  { label: 'Appointment Reminders', desc: 'Notifications before scheduled consultations', value: appointmentAlerts, set: setAppointmentAlerts },
                  { label: 'Video Call Alerts', desc: 'Popup when patient joins or leaves the call', value: callAlerts, set: setCallAlerts },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <button onClick={() => item.set(!item.value)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${item.value ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${item.value ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-4">
                    <Shield className="w-5 h-5 mr-2 text-emerald-500" /> Account Security
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center p-4 rounded-xl border border-slate-100 dark:border-white/10 justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">Two-Factor Authentication</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Protect your account with 2FA</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">Coming Soon</span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-indigo-500" /> Change Password
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="password" placeholder="Current password"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                        <input type="password" placeholder="New password"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/30 p-6">
                  <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center mb-2">
                    <Trash2 className="w-4 h-4 mr-2" /> Danger Zone
                  </h3>
                  <p className="text-sm text-rose-600 dark:text-rose-300 mb-4">Deleting your account will remove all patient data and consultation history.</p>
                  <button onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center text-sm font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 px-4 py-2.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab !== 'privacy' && (
              <button onClick={handleSave}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center text-sm">
                {saved ? <><CheckCircle2 className="w-5 h-5 mr-2" /> Saved!</> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
