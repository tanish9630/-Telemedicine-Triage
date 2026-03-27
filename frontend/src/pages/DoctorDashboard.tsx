import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  LayoutDashboard, Calendar as CalendarIcon, Users, HelpCircle,
  Search, Bell, BadgeCheck, TrendingUp, TrendingDown,
  Video, Phone, Check, X, Clock, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const metrics = [
  { label: 'Total Counseling', value: '2.9K', trend: '+12.5%', isUp: true },
  { label: 'Overall Booking', value: '3.2K', trend: '+8.2%', isUp: true },
  { label: 'New Appointments', value: '254', trend: '-2.4%', isUp: false },
  { label: "Today's Schedule", value: '08', trend: '+1.5%', isUp: true },
];

const ageData = [
  { name: '8-15', patients: 120 },
  { name: '16-20', patients: 250 },
  { name: '21-30', patients: 450 },
  { name: '31-40', patients: 380 },
  { name: '41-50', patients: 300 },
  { name: '51-60', patients: 220 },
  { name: '60+', patients: 150 },
];

const requests = [

  { name: "John Doe", acuity: "High", time: "2m ago", symptom: "Chest Pain" },
  { name: "Sarah Smith", acuity: "Medium", time: "15m ago", symptom: "Fever & Cough" },
];

const schedule = [
  { type: "Follow-up", patient: "Alice Cooper", date: "Today, 10:00 AM", isVideo: true },
  { type: "Initial Consult", patient: "Bob Marley", date: "Today, 11:30 AM", isVideo: false },
  { type: "Test Review", patient: "Charlie Brown", date: "Today, 02:00 PM", isVideo: true },
  { type: "Follow-up", patient: "Diana Prince", date: "Today, 04:15 PM", isVideo: true },
];

export function DoctorDashboard() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-100 flex flex-col justify-between py-6">
        <div>
          <div className="flex justify-center lg:justify-start lg:px-6 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-600/20">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="hidden lg:block ml-3 text-xl font-bold text-slate-900 mt-1">CareConnect</span>
          </div>

          <nav className="space-y-2 px-3 lg:px-4">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
            <NavItem icon={<CalendarIcon />} label="Calendar" />
            <NavItem icon={<Users />} label="Patients" />
          </nav>
        </div>

        <div className="px-3 lg:px-4">
          <NavItem icon={<HelpCircle />} label="Help & Support" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 h-20 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                className="bg-transparent border-none outline-none text-sm w-48 lg:w-80 text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">Dr. Sarah Jenkins</div>
                <div className="text-xs text-slate-500 font-medium">Cardiology</div>
              </div>
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                <BadgeCheck className="w-4 h-4 text-emerald-500 bg-white rounded-full absolute bottom-0 right-[-4px]" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">

          {/* Top Row: Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="text-sm font-semibold text-slate-500 mb-2">{metric.label}</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
                  <div className={`text-sm font-medium flex items-center mb-1 ${metric.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {metric.isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {metric.trend}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2 font-medium">vs. last year</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Center Left: Bar Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Patients Overview</h3>
                <select className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-100">
                  <option>Age Group</option>
                  <option>Gender</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="patients" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {
                        ageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 2 ? '#6366f1' : '#c7d2fe'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Center Right: Triage Requests Sidebar */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Appointment Requests</h3>
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-full">{requests.length} New</span>
              </div>

              <div className="space-y-4 flex-1">
                {requests.map((req, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full ${req.acuity === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-slate-900">{req.name}</div>
                      <div className="flex items-center text-xs text-slate-500 font-medium"><Clock className="w-3 h-3 mr-1" /> {req.time}</div>
                    </div>
                    <div className="text-sm text-slate-600 mb-4 flex items-center">
                      <AlertCircle className={`w-4 h-4 mr-1.5 ${req.acuity === 'High' ? 'text-rose-500' : 'text-amber-500'}`} />
                      {req.symptom}
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-rose-500 hover:text-white hover:border-transparent text-sm font-semibold rounded-xl py-2 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </button>
                      <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl py-2 flex items-center justify-center shadow-sm shadow-indigo-600/20 transition-colors">
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2">View all requests</button>
            </div>
          </div>

          {/* Bottom Row: Schedule Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Schedule List</h3>
              <Link to="/doctor/calendar" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View Full Calendar</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Appointment Type</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Meeting Type</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.map((slot, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-4">
                        <div className="font-semibold text-slate-900">{slot.patient}</div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {slot.type}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-600">
                        {slot.date}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center text-sm font-medium text-slate-600">
                          {slot.isVideo ? (
                            <><Video className="w-4 h-4 mr-2 text-indigo-500" /> Video Call</>
                          ) : (
                            <><Phone className="w-4 h-4 mr-2 text-emerald-500" /> Audio Call</>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <Link to={`/consultation/room-${i}`} className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-sm">
                          Join Call
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Helper component for Sidebar items
function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center lg:space-x-4 p-3 lg:px-4 rounded-2xl cursor-pointer transition-all duration-200 group
      ${active ? 'bg-indigo-50 text-indigo-600 relative' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
    }>
      {active && <div className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-lg" />}
      <div className={`flex items-center justify-center ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </div>
      <span className={`hidden lg:block font-semibold ${active ? 'text-indigo-700' : ''}`}>{label}</span>
    </div>
  );
}
