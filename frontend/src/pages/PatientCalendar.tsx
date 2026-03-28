import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, Video, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, TrendingUp, LayoutGrid, List,
  Stethoscope, CalendarDays, Sparkles } from 'lucide-react';


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

function statusInfo(s: string, channelName?: string | null) {
  // Check if the video call was completed
  const isCompleted = channelName && localStorage.getItem(`completed_${channelName}`) === 'true';
  if (isCompleted) return {
    icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    cls: 'bg-indigo-100 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-400/20',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    strip: 'bg-indigo-500',
    label: 'Completed ✅'
  };
  if (s === 'approved') return {
    icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    cls: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/20',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    strip: 'bg-emerald-500',
    label: 'Approved'
  };
  if (s === 'rejected') return {
    icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
    cls: 'bg-rose-100 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-400/20',
    dot: 'bg-rose-500 dark:bg-rose-400',
    strip: 'bg-rose-500',
    label: 'Rejected'
  };
  return {
    icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
    cls: 'bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/20',
    dot: 'bg-amber-500 dark:bg-amber-400',
    strip: 'bg-amber-500',
    label: 'Pending'
  };
}

type ViewMode = 'month' | 'week' | 'list';

export function PatientCalendar() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [tooltipAppt, setTooltipAppt] = useState<{ appt: Appointment; x: number; y: number } | null>(null);
  const [animDir, setAnimDir] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/appointments/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setAppts(data); });
  }, [token]);

  useEffect(() => {
    const handler = () => setTooltipAppt(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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

  const changeMonth = (dir: -1 | 1) => {
    if (isAnimating) return;
    setAnimDir(dir === 1 ? 'right' : 'left');
    setIsAnimating(true);
    setTimeout(() => {
      setViewDate(new Date(year, month + dir, 1));
      setIsAnimating(false);
      setAnimDir(null);
    }, 200);
  };

  // Week view helpers
  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return Array.from({ length: 7 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), diff + i));
  };
  const weekDates = getWeekDates(selected || today);

  // All upcoming sorted by date
  const upcomingList = [...appts]
    .filter(a => new Date(a.dateTime) >= today)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-6 py-4 z-30 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Health Calendar</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{MONTHS[month]} {year}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="hidden md:flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 space-x-1">
              {([['month', <LayoutGrid className="w-4 h-4" />], ['week', <CalendarDays className="w-4 h-4" />], ['list', <List className="w-4 h-4" />]] as [ViewMode, React.ReactNode][]).map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {icon}
                  <span className="hidden lg:inline">{mode}</span>
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-5 pl-3 border-l border-slate-200 dark:border-white/10">
              <Stat label="Upcoming" value={upcoming.length} color="indigo" />
              <Stat label="Approved" value={approved.length} color="emerald" />
              <Stat label="Pending" value={pending.length} color="amber" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-6 w-full grid lg:grid-cols-5 gap-8">
        {/* Calendar / Week / List Panel */}
        <div className="lg:col-span-3">

          {/* ── MONTH VIEW ── */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
              {/* Month Navigation */}
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeMonth(-1)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{MONTHS[month]}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{year}</p>
                </div>
                <button onClick={() => changeMonth(1)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all group">
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest py-2">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className={`grid grid-cols-7 gap-1 transition-all duration-200 ${isAnimating ? (animDir === 'right' ? 'opacity-0 translate-x-3' : 'opacity-0 -translate-x-3') : 'opacity-100 translate-x-0'}`}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayDate = new Date(year, month, i + 1);
                  const key = dayDate.toDateString();
                  const dayAppts = apptsByDay[key] || [];
                  const isToday = key === today.toDateString();
                  const isSelected = selected?.toDateString() === key;
                  const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(dayDate)}
                      className={`
                        relative flex flex-col items-center justify-start pt-2 pb-1.5 rounded-2xl text-sm font-semibold
                        transition-all duration-200 min-h-[56px] group overflow-hidden
                        ${isSelected
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105 z-10'
                          : isToday
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/40'
                          : isPast
                          ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:scale-105'
                        }
                      `}
                    >
                      <span className="z-10 relative leading-none">{i + 1}</span>

                      {/* Event strips */}
                      {dayAppts.length > 0 && (
                        <div className="w-full px-1 mt-1 space-y-0.5 z-10">
                          {dayAppts.slice(0, 2).map((a, ai) => {
                            const si = statusInfo(a.status, a.channelName);
                            return (
                              <div
                                key={ai}
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setTooltipAppt({ appt: a, x: rect.left, y: rect.bottom });
                                }}
                                onMouseLeave={() => setTooltipAppt(null)}
                                className={`w-full h-1 rounded-full ${isSelected ? 'bg-white/60' : si.strip} transition-all`}
                              />
                            );
                          })}
                          {dayAppts.length > 2 && (
                            <div className={`text-[9px] font-bold text-center ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                              +{dayAppts.length - 2}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Badge */}
                      {dayAppts.length > 0 && !isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm z-20">
                          {dayAppts.length}
                        </div>
                      )}

                      {/* Today glow */}
                      {isToday && !isSelected && (
                        <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-6 pt-5 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Approved</span></div>
                <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Pending</span></div>
                <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span>Rejected</span></div>
                <button onClick={() => setSelected(today)} className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" /> Today
                </button>
              </div>
            </div>
          )}

          {/* ── WEEK VIEW ── */}
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm p-6 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => {
                    const d = new Date(selected || today);
                    d.setDate(d.getDate() - 7);
                    setSelected(d);
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    const d = new Date(selected || today);
                    d.setDate(d.getDate() + 7);
                    setSelected(d);
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((d, i) => {
                  const key = d.toDateString();
                  const dayAppts = apptsByDay[key] || [];
                  const isToday = key === today.toDateString();
                  const isSelected = selected?.toDateString() === key;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(d)}
                      className={`flex flex-col items-center rounded-2xl py-3 px-1 transition-all duration-200 min-h-[100px]
                        ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' : isToday ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-400/30' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'}
                      `}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">{DAYS[i]}</span>
                      <span className="text-xl font-black mt-1">{d.getDate()}</span>
                      {dayAppts.length > 0 && (
                        <div className="mt-2 w-full px-1 space-y-1">
                          {dayAppts.slice(0, 3).map((a, ai) => {
                            const si = statusInfo(a.status, a.channelName);
                            return (
                              <div key={ai} className={`w-full h-1.5 rounded-full ${isSelected ? 'bg-white/50' : si.strip}`} />
                            );
                          })}
                        </div>
                      )}
                      {dayAppts.length > 0 && (
                        <span className={`mt-1 text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          {dayAppts.length} appt{dayAppts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center">
                <TrendingUp className="w-5 h-5 text-indigo-500 mr-2" />
                <h3 className="font-bold text-slate-900 dark:text-white">All Upcoming Appointments</h3>
                <span className="ml-auto text-xs text-slate-400">{upcomingList.length} total</span>
              </div>
              {upcomingList.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-slate-500 text-sm">No upcoming appointments</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {upcomingList.map(a => {
                    const si = statusInfo(a.status, a.channelName);
                    const dt = new Date(a.dateTime);
                    return (
                      <div key={a._id} className="flex items-center p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        <div className={`w-1 h-12 rounded-full mr-4 flex-shrink-0 ${si.dot}`} />
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm mr-4 flex-shrink-0">
                          {a.doctor.fullName[0]}{a.doctor.fullName.split(' ')[1]?.[0] || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white">{a.doctor.fullName}</div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-0.5">{a.doctor.specialization || 'General Practice'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${si.cls}`}>{si.icon}<span className="capitalize">{a.status}</span></span>
                          {a.status === 'approved' && a.channelName && (
                            <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-colors flex items-center">
                              <Video className="w-3.5 h-3.5 mr-1" /> Join
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">
              {selected ? selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedAppts.length} appointment{selectedAppts.length !== 1 ? 's' : ''} on this day</p>
          </div>

          {selectedAppts.length === 0 ? (
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-10 text-center shadow-sm transition-colors">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">{selected ? 'No appointments on this day.' : 'Click a date to see your appointments.'}</p>
            </div>
          ) : selectedAppts.map(a => {
            const si = statusInfo(a.status, a.channelName);
            return (
              <div key={a._id} className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 rounded-2xl p-5 transition-colors hover:shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm mr-3">
                    {a.doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 dark:text-white">{a.doctor.fullName}</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center">
                      <Stethoscope className="w-3 h-3 mr-1" />
                      {a.doctor.specialization || 'General Practice'}
                    </div>
                  </div>
                  <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${si.cls}`}>
                    {si.icon} <span className="capitalize">{a.status}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 text-center transition-colors">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Date</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">{new Date(a.dateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 text-center transition-colors">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Time</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">{new Date(a.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
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
                {upcoming.slice(0, 5).map(a => {
                  const si = statusInfo(a.status, a.channelName);
                  return (
                    <div key={a._id} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 px-1 rounded-lg" onClick={() => setSelected(new Date(a.dateTime))}>
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
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/consultation/${a.channelName}`); }}
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

      {/* Tooltip */}
      {tooltipAppt && (
        <div
          ref={tooltipRef}
          className="fixed z-[999] bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl shadow-xl p-3 max-w-[220px] pointer-events-none"
          style={{ top: tooltipAppt.y + 8, left: Math.min(tooltipAppt.x, window.innerWidth - 240) }}
        >
          <div className="font-semibold text-slate-900 dark:text-white text-sm">{tooltipAppt.appt.doctor.fullName}</div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">{tooltipAppt.appt.doctor.specialization}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(tooltipAppt.appt.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className={`mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full inline-block ${statusInfo(tooltipAppt.appt.status, tooltipAppt.appt.channelName).cls}`}>
            {statusInfo(tooltipAppt.appt.status, tooltipAppt.appt.channelName).label}
          </div>
        </div>
      )}

    </>
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
