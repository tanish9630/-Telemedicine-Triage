import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, User, Mail, Lock, Heart, Phone, Bell, Shield, Trash2,
  Save, CheckCircle2, Camera, Palette, Activity, AlertCircle, Settings,
  Stethoscope, Calendar, MessageSquare
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-indigo-600',
];

export function PatientSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'notifications' | 'privacy'>('profile');
  const [saved, setSaved] = useState(false);

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(localStorage.getItem('patient_phone') || '');
  const [dob, setDob] = useState(localStorage.getItem('patient_dob') || '');
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem('patient_avatar_color') || AVATAR_COLORS[0]);

  // Medical
  const [bloodType, setBloodType] = useState(localStorage.getItem('patient_blood') || '');
  const [allergies, setAllergies] = useState(localStorage.getItem('patient_allergies') || '');
  const [conditions, setConditions] = useState(localStorage.getItem('patient_conditions') || '');
  const [emergencyName, setEmergencyName] = useState(localStorage.getItem('patient_emg_name') || '');
  const [emergencyPhone, setEmergencyPhone] = useState(localStorage.getItem('patient_emg_phone') || '');

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(localStorage.getItem('notif_email') !== 'false');
  const [callAlerts, setCallAlerts] = useState(localStorage.getItem('notif_calls') !== 'false');
  const [appointmentReminders, setAppointmentReminders] = useState(localStorage.getItem('notif_appt') !== 'false');

  const handleSave = () => {
    // Save profile
    localStorage.setItem('patient_phone', phone);
    localStorage.setItem('patient_dob', dob);
    localStorage.setItem('patient_avatar_color', avatarColor);
    // Save medical
    localStorage.setItem('patient_blood', bloodType);
    localStorage.setItem('patient_allergies', allergies);
    localStorage.setItem('patient_conditions', conditions);
    localStorage.setItem('patient_emg_name', emergencyName);
    localStorage.setItem('patient_emg_phone', emergencyPhone);
    // Save notifications
    localStorage.setItem('notif_email', String(emailNotifs));
    localStorage.setItem('notif_calls', String(callAlerts));
    localStorage.setItem('notif_appt', String(appointmentReminders));

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'medical', label: 'Medical Info', icon: <Heart className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 sticky top-0 z-40 shadow-sm transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/patient/dashboard')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your profile & preferences</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { to: '/patient/dashboard', icon: <Activity className="w-4 h-4" />, label: 'Dashboard' },
                { to: '/find-doctors', icon: <Stethoscope className="w-4 h-4" />, label: 'Doctors' },
                { to: '/patient/calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
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
            {/* Avatar Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 text-center transition-colors">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-2xl mx-auto mb-3 shadow-lg`}>
                {initials}
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{fullName || 'Your Name'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{email}</div>
              <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 mr-1" /> Patient Account
              </div>
            </div>

            {/* Tab Nav */}
            <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold transition-all text-left border-b border-slate-50 dark:border-white/5 last:border-0 ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-5">
            {/* Profile Tab */}
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
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                    <input value={dob} onChange={e => setDob(e.target.value)} type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/10 pt-5">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-indigo-500" /> Avatar Color
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setAvatarColor(c)}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c} transition-all ${avatarColor === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/10 pt-5">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-indigo-500" /> Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="password" placeholder="Current password"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                    <input type="password" placeholder="New password"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* Medical Tab */}
            {activeTab === 'medical' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-rose-500" /> Medical Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Blood Type</label>
                    <select value={bloodType} onChange={e => setBloodType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                      <option value="">Select blood type</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Known Allergies</label>
                    <input value={allergies} onChange={e => setAllergies(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder="e.g. Penicillin, Peanuts" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Chronic Conditions</label>
                  <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
                    placeholder="e.g. Diabetes Type 2, Hypertension, Asthma..." />
                </div>

                <div className="border-t border-slate-100 dark:border-white/10 pt-5">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-emerald-500" /> Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Contact Name</label>
                      <input value={emergencyName} onChange={e => setEmergencyName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        placeholder="Family member name" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Contact Phone</label>
                      <input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} type="tel"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        placeholder="+91 99999 88888" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-amber-500" /> Notification Preferences
                </h2>
                {[
                  { label: 'Email Notifications', desc: 'Appointment confirmations and health tips via email', value: emailNotifs, set: setEmailNotifs },
                  { label: 'Video Call Alerts', desc: 'Popup notification when your doctor starts a call', value: callAlerts, set: setCallAlerts },
                  { label: 'Appointment Reminders', desc: '24h and 1h before scheduled consultations', value: appointmentReminders, set: setAppointmentReminders },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${item.value ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${item.value ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-4">
                    <Shield className="w-5 h-5 mr-2 text-emerald-500" /> Privacy & Security
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center p-4 rounded-xl border border-slate-100 dark:border-white/10 justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">Two-Factor Authentication</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add extra security to your account</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">Coming Soon</span>
                    </div>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-3 text-amber-500" />
                        <div className="text-left">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">Export My Data</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Download all your health records</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/30 p-6 transition-colors">
                  <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center mb-2">
                    <Trash2 className="w-4 h-4 mr-2" /> Danger Zone
                  </h3>
                  <p className="text-sm text-rose-600 dark:text-rose-300 mb-4">Once you delete your account, all data will be permanently removed.</p>
                  <button onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center text-sm font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 px-4 py-2.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeTab !== 'privacy' && (
              <button onClick={handleSave}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center text-sm">
                {saved ? <><CheckCircle2 className="w-5 h-5 mr-2" /> Saved Successfully!</> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
