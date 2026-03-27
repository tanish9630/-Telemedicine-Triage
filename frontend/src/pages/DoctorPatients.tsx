import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, Mail, Video, ChevronDown, ChevronUp, Clock } from 'lucide-react';

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

export function DoctorPatients() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const statusPill = (s: string) => {
    const base = 'text-xs font-semibold px-2.5 py-0.5 rounded-full border';
    if (s === 'approved') return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    if (s === 'rejected') return `${base} bg-rose-50 text-rose-700 border-rose-200`;
    return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center space-x-3 sticky top-0 z-40 shadow-sm">
        <button onClick={() => navigate('/doctor/dashboard')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">My Patients</span>
        <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-full">{groups.length} patients</span>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-4">
        {groups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No patients yet. Approve appointment requests to see them here.</p>
          </div>
        ) : groups.map(g => {
          const upcoming = g.appointments.filter(a => new Date(a.dateTime) >= new Date() && a.status === 'approved');
          const isOpen = expanded === g.patient._id;
          return (
            <div key={g.patient._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : g.patient._id)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm mr-4">
                    {g.patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{g.patient.fullName}</div>
                    <div className="flex items-center text-slate-500 text-sm mt-0.5"><Mail className="w-3.5 h-3.5 mr-1.5" />{g.patient.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="font-bold text-slate-900">{g.appointments.length} appts</div>
                  </div>
                  {upcoming.length > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Upcoming</div>
                      <div className="font-bold text-emerald-600">{upcoming.length}</div>
                    </div>
                  )}
                  {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 p-6 space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Appointment History</h4>
                  {g.appointments.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(a => (
                    <div key={a._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {new Date(a.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.reason}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={statusPill(a.status)}>{a.status}</span>
                        {a.status === 'approved' && a.channelName && (
                          <button onClick={() => navigate(`/consultation/${a.channelName}`)}
                            className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors">
                            <Video className="w-3 h-3 mr-1" /> Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
