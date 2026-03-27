import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Users, Mail, Video, ChevronDown, ChevronUp, Clock,
  Search, Calendar, ActivitySquare, CheckCircle2, XCircle, AlertCircle, Heart
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Appointment {
  _id: string;
  patient: { _id: string; fullName: string; email: string };
  dateTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  channelName: string | null;
}

interface PatientGroup {
  patient: { _id: string; fullName: string; email: string };
  appointments: Appointment[];
}

function statusBadge(s: string) {
  if (s === 'approved') return <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</span>;
  if (s === 'rejected') return <span className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-400/10 border border-rose-200 dark:border-rose-400/20 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1" />Rejected</span>;
  return <span className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 px-2.5 py-1 rounded-full"><AlertCircle className="w-3 h-3 mr-1" />Pending</span>;
}

export function DoctorPatients() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/appointments/doctor`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Appointment[]) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, PatientGroup> = {};
        data.forEach(a => {
          if (!a.patient?._id) return;
          const id = a.patient._id;
          if (!map[id]) map[id] = { patient: a.patient, appointments: [] };
          map[id].appointments.push(a);
        });
        setGroups(Object.values(map));
      });
  }, [token]);

  const filtered = groups.filter(g =>
    g.patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
    g.patient.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalApproved = groups.reduce((s, g) => s + g.appointments.filter(a => a.status === 'approved').length, 0);
  const totalPending = groups.reduce((s, g) => s + g.appointments.filter(a => a.status === 'pending').length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors">
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
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Patients</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{groups.length} registered patients</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
                className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64" />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-sm transition-colors">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{groups.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Patients</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-sm transition-colors">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalApproved}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consultations Done</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-sm transition-colors">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalPending}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Requests</div>
            </div>
          </div>
        </div>

        {/* Patient List */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-20 text-center shadow-sm transition-colors">
            <Heart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {search ? 'No patients match your search.' : 'No patients yet. Approve appointment requests to see them here.'}
            </p>
          </div>
        ) : filtered.map(g => {
          const upcoming = g.appointments.filter(a => new Date(a.dateTime) >= new Date() && a.status === 'approved');
          const approved = g.appointments.filter(a => a.status === 'approved');
          const isOpen = expanded === g.patient._id;
          const initials = g.patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div key={g.patient._id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${isOpen ? 'border-indigo-300 dark:border-indigo-500/30' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/20'}`}>
              {/* Patient Header */}
              <button onClick={() => setExpanded(isOpen ? null : g.patient._id)}
                className="w-full text-left p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-600 flex items-center justify-center text-indigo-700 dark:text-white font-bold text-lg mr-4">
                    {initials}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{g.patient.fullName}</div>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                      <Mail className="w-3.5 h-3.5 mr-1.5" />{g.patient.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="hidden sm:grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{g.appointments.length}</div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{approved.length}</div>
                      <div className="text-xs text-slate-500">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{upcoming.length}</div>
                      <div className="text-xs text-slate-500">Upcoming</div>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl transition-all ${isOpen ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-400' : 'bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </button>

              {/* Expanded Appointments */}
              {isOpen && (
                <div className="border-t border-slate-100 dark:border-white/5 p-6 transition-colors">
                  {/* Upcoming highlighted */}
                  {upcoming.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                        📅 Upcoming Appointments
                      </h4>
                      <div className="space-y-2">
                        {upcoming.map(a => (
                          <div key={a._id} className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl transition-colors">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                {new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 ml-5">{a.reason}</p>
                            </div>
                            {a.channelName && (
                              <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                                className="flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-sm">
                                <Video className="w-3.5 h-3.5 mr-1.5" /> Join Call
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full history */}
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                    <ActivitySquare className="w-3.5 h-3.5 mr-1.5" /> Appointment History
                  </h4>
                  <div className="space-y-2">
                    {g.appointments.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(a => (
                      <div key={a._id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-300 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-2 text-slate-500" />
                            {new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5 ml-5">{a.reason}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {statusBadge(a.status)}
                          {a.status === 'approved' && a.channelName && (
                            <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                              className="flex items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-white bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all">
                              <Video className="w-3 h-3 mr-1" /> Join
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Last consulted */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 transition-colors">
                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> Last consulted: {
                      approved.length > 0
                        ? new Date(Math.max(...approved.map(a => new Date(a.dateTime).getTime()))).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Never'
                    }</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
