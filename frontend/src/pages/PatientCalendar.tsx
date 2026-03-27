import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, Video, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Appointment {
  _id: string;
  doctor: { fullName: string; specialization: string };
  dateTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  channelName: string | null;
}

function statusIcon(s: string) {
  if (s === 'approved') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (s === 'rejected') return <XCircle className="w-4 h-4 text-rose-500" />;
  return <AlertCircle className="w-4 h-4 text-amber-500" />;
}
function statusColor(s: string) {
  if (s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function PatientCalendar() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setAppts);
  }, [token]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const apptsByDay: Record<string, Appointment[]> = {};
  appts.forEach(a => {
    const key = new Date(a.dateTime).toDateString();
    apptsByDay[key] = [...(apptsByDay[key] || []), a];
  });

  const selectedAppts = selected ? (apptsByDay[selected.toDateString()] || []) : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center space-x-3 sticky top-0 z-40 shadow-sm">
        <button onClick={() => navigate('/patient/dashboard')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">My Calendar</span>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid lg:grid-cols-5 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 font-bold text-lg">‹</button>
            <span className="text-lg font-bold text-slate-900">{MONTHS[month]} {year}</span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 font-bold text-lg">›</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayDate = new Date(year, month, i + 1);
              const key = dayDate.toDateString();
              const dayAppts = apptsByDay[key] || [];
              const isToday = dayDate.toDateString() === today.toDateString();
              const isSelected = selected?.toDateString() === key;
              return (
                <button key={i} onClick={() => setSelected(dayDate)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all
                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : isToday ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' : 'hover:bg-slate-50 text-slate-700'}`}>
                  {i + 1}
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayAppts.slice(0, 3).map((a, ai) => (
                        <div key={ai} className={`w-1.5 h-1.5 rounded-full ${a.status === 'approved' ? 'bg-emerald-400' : a.status === 'rejected' ? 'bg-rose-400' : 'bg-amber-400'} ${isSelected ? 'bg-white/70' : ''}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointments Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">
            {selected ? selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
          </h3>
          {selectedAppts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
              {selected ? 'No appointments on this day.' : 'Click a date to see appointments.'}
            </div>
          ) : selectedAppts.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{a.doctor.fullName}</div>
                  <div className="text-xs text-indigo-600">{a.doctor.specialization || 'General'}</div>
                </div>
                <span className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(a.status)}`}>
                  {statusIcon(a.status)} <span className="ml-1 capitalize">{a.status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center mb-2"><Clock className="w-3.5 h-3.5 mr-1" />{new Date(a.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-3">{a.reason}</p>
              {a.status === 'approved' && a.channelName && (
                <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors">
                  <Video className="w-4 h-4 mr-1.5" /> Join Video Call
                </button>
              )}
            </div>
          ))}

          {/* All upcoming */}
          <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">All Upcoming</h4>
            {appts.filter(a => new Date(a.dateTime) >= new Date() && a.status !== 'rejected').length === 0
              ? <p className="text-xs text-slate-400">No upcoming appointments.</p>
              : appts.filter(a => new Date(a.dateTime) >= new Date() && a.status !== 'rejected').map(a => (
                <div key={a._id} className={`flex items-center justify-between p-3 rounded-xl mb-2 border ${statusColor(a.status)}`}>
                  <div>
                    <div className="text-xs font-bold">{a.doctor.fullName}</div>
                    <div className="text-xs">{new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  {a.status === 'approved' && a.channelName && (
                    <button onClick={() => navigate(`/consultation/${a.channelName}`)} className="bg-white border border-indigo-200 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
                      <Video className="w-3 h-3 mr-1" /> Join
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
