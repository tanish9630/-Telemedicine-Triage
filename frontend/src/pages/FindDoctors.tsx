import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Calendar, Clock, ArrowLeft, Loader2, Search, CheckCircle2, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  email: string;
}

export function FindDoctors() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/appointments/doctors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setDoctors)
      .finally(() => setLoading(false));
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
      if (res.ok) { setSuccess(true); setTimeout(() => { setBookingDoctor(null); setSuccess(false); setDate(''); setTime(''); setReason(''); }, 2000); }
    } finally { setSubmitting(false); }
  };

  const filtered = doctors.filter(d =>
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/patient/dashboard')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Find a Doctor</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or specialization..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 w-72" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium">No doctors found.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
            {filtered.map(doc => (
              <div key={doc._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg mr-3">
                    {doc.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{doc.fullName}</div>
                    <div className="text-xs text-indigo-600 font-medium">{doc.specialization || 'General Practice'}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4">{doc.email}</p>
                <button onClick={() => setBookingDoctor(doc)} className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-indigo-600/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" /> Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
            {success ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-900 mb-1">Request Sent!</h3>
                <p className="text-slate-500 text-sm">Your appointment request has been sent to {bookingDoctor.fullName}.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Book Appointment</h3>
                    <p className="text-sm text-slate-500">with {bookingDoctor.fullName}</p>
                  </div>
                  <button onClick={() => setBookingDoctor(null)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-indigo-500" /> Date</label>
                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center"><Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> Time</label>
                    <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason / Symptoms</label>
                    <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe your symptoms or reason for consultation..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/25 flex items-center justify-center">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Appointment Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
