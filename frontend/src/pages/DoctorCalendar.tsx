import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, Video, Clock, ChevronLeft, ChevronRight, Users, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Appointment {
  _id: string;
  patient: { fullName: string; email: string };
  dateTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  channelName: string | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function DoctorCalendar() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  useEffect(() => {
    fetch(`${API}/appointments/doctor`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setAppts(Array.isArray(data) ? data.filter((a: Appointment) => a.status === 'approved') : []));
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
  const todayAppts = apptsByDay[today.toDateString()] || [];
  const thisMonthAppts = appts.filter(a => {
    const d = new Date(a.dateTime);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-sans text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/doctor/dashboard')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Appointment Calendar</h1>
                <p className="text-xs text-slate-400">{MONTHS[month]} {year}</p>
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div className="hidden md:flex items-center space-x-6">
            <Stat label="Today" value={todayAppts.length} color="indigo" />
            <Stat label="This Month" value={thisMonthAppts.length} color="emerald" />
            <Stat label="Total" value={appts.length} color="purple" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid lg:grid-cols-5 gap-8">
        {/* Calendar Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl p-6">
            {/* Month Nav */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{MONTHS[month]}</h2>
                <p className="text-sm text-slate-400">{year}</p>
              </div>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-3">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest py-2">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayDate = new Date(year, month, i + 1);
                const key = dayDate.toDateString();
                const dayAppts = apptsByDay[key] || [];
                const isToday = key === today.toDateString();
                const isSelected = selected?.toDateString() === key;
                const isPast = dayDate < today && !isToday;

                return (
                  <button key={i} onClick={() => setSelected(dayDate)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 group
                      ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105' 
                        : isToday ? 'bg-indigo-600/20 text-indigo-300 ring-2 ring-indigo-500/50' 
                        : isPast ? 'text-slate-600 hover:bg-white/5' 
                        : 'text-slate-300 hover:bg-white/10'}`}>
                    {i + 1}
                    {dayAppts.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayAppts.slice(0, 3).map((_, ai) => (
                          <div key={ai} className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-white/70' : 'bg-emerald-400'}`} />
                        ))}
                      </div>
                    )}
                    {dayAppts.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {dayAppts.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-white/5 text-xs text-slate-500">
              <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600/40 ring-2 ring-indigo-500/50" /><span>Today</span></div>
              <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600" /><span>Selected</span></div>
              <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span>Appointments</span></div>
            </div>
          </div>
        </div>

        {/* Appointments Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {selected ? selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
            </h3>
            <p className="text-sm text-slate-400">{selectedAppts.length} appointment{selectedAppts.length !== 1 ? 's' : ''} scheduled</p>
          </div>

          {selectedAppts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                {selected ? 'No appointments on this day.' : 'Click a date to view appointments.'}
              </p>
            </div>
          ) : selectedAppts.map(a => (
            <div key={a._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-all group">
              <div className="flex items-center mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-lg">
                  {a.patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{a.patient.fullName}</div>
                  <div className="text-xs text-slate-400">{a.patient.email}</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 rounded-xl p-3 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs text-slate-500">Time</div>
                    <div className="text-sm font-semibold text-white">{new Date(a.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs text-slate-500">Status</div>
                    <div className="text-sm font-semibold text-emerald-400 capitalize">{a.status}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 mb-4">
                <div className="text-xs text-slate-500 mb-1">Reason</div>
                <p className="text-sm text-slate-300">{a.reason}</p>
              </div>

              {a.channelName && (
                <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-600/50">
                  <Video className="w-4 h-4 mr-2" /> Start Video Consultation
                </button>
              )}
            </div>
          ))}

          {/* Upcoming this month */}
          {thisMonthAppts.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" /> This Month
              </h4>
              <div className="space-y-2">
                {thisMonthAppts.slice(0, 5).map(a => (
                  <div key={a._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-white">{a.patient.fullName}</div>
                      <div className="text-xs text-slate-500">{new Date(a.dateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <button onClick={() => setSelected(new Date(a.dateTime))}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                      View →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}
