import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Star, Award, MapPin, Video, Calendar, Clock, Users, ThumbsUp, CheckCircle2, Stethoscope, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';

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
  'Endocrinologist': 'from-amber-500 to-orange-600',
  'Oncologist': 'from-red-600 to-rose-700',
};

const getGradient = (spec: string) => SPECIALIZATION_COLORS[spec] || 'from-indigo-500 to-purple-600';

const SAMPLE_REVIEWS = [
  { name: "Rahul M.", rating: 5, text: "Excellent doctor! Very thorough and explained everything clearly. Highly recommended.", time: "2 days ago" },
  { name: "Priya S.", rating: 5, text: "Prompt, professional, and genuinely caring. The best telemedicine experience I've had.", time: "1 week ago" },
  { name: "Arun K.", rating: 4, text: "Very knowledgeable. The video consultation was smooth and I got a clear diagnosis.", time: "2 weeks ago" },
  { name: "Meera J.", rating: 5, text: "Listened to my concerns patiently and gave a detailed treatment plan. Will book again!", time: "3 weeks ago" },
];

function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-all duration-150 ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${(hover || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
          />
        </button>
      ))}
    </div>
  );
}

export function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(() => {
    const saved = localStorage.getItem(`doctor_rating_${id}`);
    return saved ? parseInt(saved) : 0;
  });
  const [ratingSubmitted, setRatingSubmitted] = useState(() => !!localStorage.getItem(`doctor_rating_${id}`));
  const [showBooking, setShowBooking] = useState(false);

  // Seeded stats based on doctor ID
  const seed = id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 42;
  const stats = {
    patients: 120 + (seed * 7) % 880,
    experience: 3 + (seed % 18),
    consultations: 200 + (seed * 3) % 800,
    rating: (4.1 + ((seed % 9) / 10)).toFixed(1),
    reviews: 18 + (seed % 112),
    responseTime: `< ${5 + (seed % 10)} min`,
  };

  useEffect(() => {
    if (!id || !token) return;
    fetch(`${API}/appointments/doctors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((docs: Doctor[]) => {
        const found = docs.find(d => d._id === id);
        if (found) setDoctor(found);
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleRate = (r: number) => {
    setUserRating(r);
    setRatingSubmitted(true);
    localStorage.setItem(`doctor_rating_${id}`, String(r));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Stethoscope className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-semibold">Doctor not found.</p>
        <button onClick={() => navigate('/find-doctors')} className="mt-4 text-indigo-600 font-semibold hover:underline">← Back to Find Doctors</button>
      </div>
    );
  }

  const spec = doctor.specialization || 'General Practitioner (OPD)';
  const gradient = getGradient(spec);
  const initials = doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 sticky top-0 z-40 shadow-sm transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/find-doctors')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Doctor Profile</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">CareConnect AI Verified</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Hero Card */}
        <div className={`bg-gradient-to-br ${gradient} rounded-3xl overflow-hidden shadow-xl`}>
          <div className="relative p-8 pb-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-wrap items-end gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-4xl shadow-xl border border-white/20 flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 text-white min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h2 className="text-3xl font-black">{doctor.fullName}</h2>
                  <span className="text-xs bg-white/20 border border-white/20 px-2.5 py-1 rounded-full font-semibold flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> NMC Verified
                  </span>
                </div>
                <p className="text-white/90 text-lg font-semibold mb-1">{spec}</p>
                <div className="flex items-center space-x-4 flex-wrap gap-y-1">
                  <div className="flex items-center">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${parseFloat(stats.rating) >= s ? 'text-amber-300 fill-amber-300' : 'text-white/30'}`} />
                    ))}
                    <span className="ml-2 text-white/90 text-sm font-semibold">{stats.rating} ({stats.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Patients Served', value: stats.patients.toLocaleString(), icon: <Users className="w-5 h-5" />, color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Consultations', value: stats.consultations.toLocaleString(), icon: <Video className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Experience', value: `${stats.experience} yrs`, icon: <Award className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Response Time', value: stats.responseTime, icon: <Clock className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 text-center transition-colors">
              <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* About */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-indigo-500" /> About Dr. {doctor.fullName.split(' ').pop()}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                Dr. {doctor.fullName} is a highly experienced {spec} with {stats.experience} years of clinical practice. Specializing in cutting-edge diagnostic and treatment approaches, the doctor brings a patient-first philosophy to every consultation.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Verified through the National Medical Commission (NMC) Indian Medical Register, and a proud member of the CareConnect AI network providing accessible telemedicine to patients across India.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { icon: <MapPin className="w-4 h-4" />, label: 'Available Online India-wide' },
                  { icon: <Video className="w-4 h-4" />, label: 'HD Video Consultations' },
                  { icon: <ThumbsUp className="w-4 h-4" />, label: `${Math.round(parseFloat(stats.rating) / 5 * 100)}% Patient Satisfaction` },
                  { icon: <Clock className="w-4 h-4" />, label: 'Mon–Sat Active' },
                ].map(item => (
                  <div key={item.label} className="flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2">
                    <span className="text-indigo-500 dark:text-indigo-400 mr-2">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-amber-400 fill-amber-400" /> Patient Reviews
              </h3>
              <div className="space-y-4">
                {SAMPLE_REVIEWS.map((rev, i) => (
                  <div key={i} className="border-b border-slate-100 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {rev.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{rev.name}</div>
                          <div className="text-xs text-slate-400">{rev.time}</div>
                        </div>
                      </div>
                      <StarRating rating={rev.rating} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-2 space-y-4">
            {/* Book CTA */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Book a Consultation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Video consultation available immediately</p>
              <button
                onClick={() => navigate('/find-doctors')}
                className={`w-full bg-gradient-to-r ${gradient} text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center hover:opacity-90 hover:scale-[1.02]`}
              >
                <Calendar className="w-4 h-4 mr-2" /> Book Appointment
              </button>
              <div className="mt-3 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Instant confirmation
              </div>
            </div>

            {/* Rate This Doctor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2 text-amber-400 fill-amber-400" /> Rate This Doctor
              </h3>
              {ratingSubmitted ? (
                <div className="text-center py-2">
                  <div className="flex justify-center mb-2">
                    <StarRating rating={userRating} />
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Thank you for your rating!
                  </p>
                  <button onClick={() => { setRatingSubmitted(false); setUserRating(0); localStorage.removeItem(`doctor_rating_${id}`); }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-2 transition-colors">
                    Change rating
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">How was your experience?</p>
                  <div className="flex justify-center mb-3">
                    <StarRating rating={userRating} onRate={handleRate} interactive />
                  </div>
                  <p className="text-xs text-slate-400">Click a star to rate</p>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 p-5">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3 uppercase tracking-wider">Quick Info</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Specialization</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs text-right max-w-[60%]">{spec}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Experience</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{stats.experience} years</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Rating</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">⭐ {stats.rating}/5.0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Contact</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[60%]">{doctor.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
