import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, Video, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Appointment {
  _id: string;
  doctor: { fullName: string; specialization: string };
  dateTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  channelName: string | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function statusInfo(s: string) {
  if (s === 'approved') return { icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />, cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/20', dot: 'bg-emerald-500 dark:bg-emerald-400' };
  if (s === 'rejected') return { icon: <XCircle className="w-3.5 h-3.5 mr-1" />, cls: 'bg-rose-100 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-400/20', dot: 'bg-rose-500 dark:bg-rose-400' };
  return { icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />, cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/20', dot: 'bg-amber-500 dark:bg-amber-400' };
}

export function PatientCalendar() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  useEffect(() => {
    fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setAppts(data); });
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
  const upcoming = appts.filter(a => new Date(a.dateTime) >= today && a.status !== 'rejected');
  const approved = appts.filter(a => a.status === 'approved');
  const pending = appts.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 sticky top-0 z-40 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/patient/dashboard')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Health Calendar</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{MONTHS[month]} {year}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Stat label="Upcoming" value={upcoming.length} color="indigo" />
            <Stat label="Approved" value={approved.length} color="emerald" />
            <Stat label="Pending" value={pending.length} color="amber" />
            <div className="pl-4 border-l border-slate-200 dark:border-white/10">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid lg:grid-cols-5 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{MONTHS[month]}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{year}</p>
              </div>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-3">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest py-2">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayDate = new Date(year, month, i + 1);
                const key = dayDate.toDateString();
                const dayAppts = apptsByDay[key] || [];
                const isToday = key === today.toDateString();
                const isSelected = selected?.toDateString() === key;

                return (
                  <button key={i} onClick={() => setSelected(dayDate)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200
                      ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105'
                        : isToday ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/50'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                    {i + 1}
                    {dayAppts.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayAppts.slice(0, 3).map((a, ai) => {
                          const si = statusInfo(a.status);
                          return <div key={ai} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : si.dot}`} />;
                        })}
                      </div>
                    )}
                    {dayAppts.length > 0 && !isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                        {dayAppts.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500">
              <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" /><span>Approved</span></div>
              <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" /><span>Pending</span></div>
              <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" /><span>Rejected</span></div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">
              {selected ? selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedAppts.length} appointment{selectedAppts.length !== 1 ? 's' : ''}</p>
          </div>

          {selectedAppts.length === 0 ? (
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-10 text-center shadow-sm transition-colors">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">{selected ? 'No appointments on this day.' : 'Click a date to see your appointments.'}</p>
            </div>
          ) : selectedAppts.map(a => {
            const si = statusInfo(a.status);
            return (
              <div key={a._id} className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 rounded-2xl p-5 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm mr-3">
                    {a.doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 dark:text-white">{a.doctor.fullName}</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400">{a.doctor.specialization || 'General Practice'}</div>
                  </div>
                  <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${si.cls}`}>
                    {si.icon} <span className="capitalize">{a.status}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 text-center transition-colors">
                    <div className="text-xs text-slate-500 mb-0.5">Date</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-white">{new Date(a.dateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 text-center transition-colors">
                    <div className="text-xs text-slate-500 mb-0.5">Time</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-white">{new Date(a.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 mb-3 transition-colors">
                  <div className="text-xs text-slate-500 mb-1">Reason</div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{a.reason}</p>
                </div>
                {a.status === 'approved' && a.channelName && (
                  <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30">
                    <Video className="w-4 h-4 mr-2" /> Join Video Consultation
                  </button>
                )}
              </div>
            );
          })}

          {/* Upcoming list */}
          {upcoming.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm transition-colors">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" /> All Upcoming
              </h4>
              <div className="space-y-2">
                {upcoming.map(a => {
                  const si = statusInfo(a.status);
                  return (
                    <div key={a._id} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${si.dot}`} />
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{a.doctor.fullName}</div>
                          <div className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      {a.status === 'approved' && a.channelName ? (
                        <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                          className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-white bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-600 dark:hover:bg-indigo-600/40 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center">
                          <Video className="w-3 h-3 mr-1" /> Join
                        </button>
                      ) : (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${si.cls}`}>{a.status}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const cLight: Record<string, string> = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', amber: 'text-amber-600' };
  const cDark: Record<string, string> = { indigo: 'dark:text-indigo-400', emerald: 'dark:text-emerald-400', amber: 'dark:text-amber-400' };
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${cLight[color]} ${cDark[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
    </div>
  );
}
