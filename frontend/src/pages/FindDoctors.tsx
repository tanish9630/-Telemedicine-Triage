import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Calendar, Clock, Loader2, Search, CheckCircle2, X, Star, MapPin, Award, Eye } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  email: string;
}

const SPECIALIZATION_COLORS: Record<string, string> = {
  'Cardiologist': 'from-rose-500 to-pink-600',
  'Neurologist': 'from-purple-500 to-indigo-600',
  'Pediatrician': 'from-emerald-500 to-teal-600',
  'Orthopedic Surgeon': 'from-orange-500 to-amber-600',
  'Dermatologist': 'from-cyan-500 to-blue-600',
  'General Practitioner (OPD)': 'from-indigo-500 to-blue-600',
  'Gynecologist': 'from-pink-500 to-rose-500',
  'Surgeon': 'from-slate-600 to-slate-800',
  'Psychiatrist': 'from-violet-500 to-purple-600',
  'ENT Specialist': 'from-teal-500 to-cyan-600',
  'Pulmonologist': 'from-sky-500 to-blue-600',
};

const getGradient = (spec: string) =>
  SPECIALIZATION_COLORS[spec] || 'from-indigo-500 to-purple-600';

const SPEC_DESCRIPTIONS: Record<string, string> = {
  'Cardiologist': 'Heart & Cardiovascular System',
  'Neurologist': 'Brain & Nervous System',
  'Pediatrician': 'Child & Adolescent Health',
  'Orthopedic Surgeon': 'Bones, Joints & Muscles',
  'Dermatologist': 'Skin, Hair & Nails',
  'General Practitioner (OPD)': 'Primary Care & General Health',
  'Gynecologist': 'Women\'s Health & Reproductive System',
  'Surgeon': 'Surgical Care & Procedures',
  'Psychiatrist': 'Mental Health & Behavioural Medicine',
  'ENT Specialist': 'Ear, Nose & Throat Care',
  'Pulmonologist': 'Respiratory & Lung Health',
};

export function FindDoctors() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const query = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(query.get('specialty') || '');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/appointments/doctors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setDoctors).finally(() => setLoading(false));
  }, [token]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    setSubmitting(true);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId: bookingDoctor._id, dateTime, reason }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setBookingDoctor(null); setSuccess(false); setDate(''); setTime(''); setReason(''); }, 2500);
      }
    } finally { setSubmitting(false); }
  };

  const filtered = doctors.filter(d =>
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  const specs = Array.from(new Set(doctors.map(d => d.specialization || 'General Practitioner (OPD)')));

  // Mock ratings (seeded per doctor)
  const getDoctorRating = (id: string) => {
    const saved = localStorage.getItem(`doctor_rating_${id}`);
    if (saved) return parseInt(saved);
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return parseFloat((4.1 + (seed % 9) / 10).toFixed(1));
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 z-30 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Find a Doctor</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{doctors.length} specialists available</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-600/30 dark:to-purple-600/20 px-6 py-8 transition-colors">
        <div className="max-w-6xl mx-auto relative">
          <div className="absolute top-0 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Book Your Consultation</h2>
          <p className="text-indigo-100 dark:text-slate-400 max-w-lg relative z-10 text-sm">Connect with certified medical professionals for personalized video consultations. Choose a specialist, pick your slot, and get care from the comfort of your home.</p>
          <div className="flex flex-wrap gap-2 mt-4 relative z-10">
            {specs.map(s => (
              <button key={s} onClick={() => setSearch(search === s ? '' : s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${search === s ? 'bg-white text-indigo-700 border-white dark:bg-indigo-600 dark:border-indigo-500 dark:text-white' : 'bg-white/10 border-white/20 text-indigo-50 hover:bg-white/20 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'}`}>
                {s}
              </button>
            ))}
            {search && <button onClick={() => setSearch('')} className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/10 border-white/20 text-indigo-50 hover:bg-white/20 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-white transition-all">Clear ✕</button>}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6 flex-1 w-full">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">No doctors match your search.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
            {filtered.map(doc => {
              const spec = doc.specialization || 'General Practitioner (OPD)';
              const gradient = getGradient(spec);
              const desc = SPEC_DESCRIPTIONS[spec] || 'Medical Specialist';
              const initials = doc.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const rating = getDoctorRating(doc._id);
              const seed = doc._id.charCodeAt(0) + doc._id.charCodeAt(doc._id.length - 1);
              const reviewCount = 18 + (seed % 112);

              return (
                <div key={doc._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm rounded-3xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 group flex flex-col">
                  {/* Card Header */}
                  <div className={`bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3 border border-white/20">
                      {initials}
                    </div>
                    <h3 className="text-lg font-bold text-white">{doc.fullName}</h3>
                    <p className="text-white/80 text-sm font-medium">{spec}</p>
                    {/* Stars on card */}
                    <div className="flex items-center mt-2 space-x-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${rating >= s ? 'text-amber-300 fill-amber-300' : 'text-white/30'}`} />
                      ))}
                      <span className="text-white/80 text-xs ml-1">{rating} ({reviewCount})</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{desc}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                        <Award className="w-3.5 h-3.5 mr-2 text-indigo-500 dark:text-indigo-400" />
                        Registered Professional
                      </div>
                      <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-indigo-500 dark:text-indigo-400" />
                        Available for Video Consultation
                      </div>
                      <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500 dark:text-emerald-400" />
                        Certified via CareConnect AI
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => navigate(`/doctor/profile/${doc._id}`)}
                        className="flex-1 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold py-2.5 rounded-2xl transition-all text-xs flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                      </button>
                      <button
                        onClick={() => setBookingDoctor(doc)}
                        className={`flex-1 bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-bold py-2.5 rounded-2xl transition-all shadow-md flex items-center justify-center text-xs group-hover:scale-[1.02]`}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1.5" /> Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 transition-colors">
            {success ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400">Your appointment request has been sent to <span className="text-slate-800 dark:text-white font-semibold">{bookingDoctor.fullName}</span>. You'll be notified when it's approved.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Book Appointment</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">with {bookingDoctor.fullName} · {bookingDoctor.specialization || 'General'}</p>
                  </div>
                  <button onClick={() => setBookingDoctor(null)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-indigo-500 dark:text-indigo-400" /> Preferred Date</label>
                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center"><Clock className="w-4 h-4 mr-1.5 text-indigo-500 dark:text-indigo-400" /> Preferred Time</label>
                    <input required type="time" value={time} onChange={e => setTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason / Symptoms</label>
                    <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3}
                      placeholder="Describe your symptoms or reason for consultation..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none transition-all" />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Calendar className="w-4 h-4 mr-2" /> Send Request</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
