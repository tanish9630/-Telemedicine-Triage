import { Link } from 'react-router-dom';
import { HeartPulse, Mail, Phone, Shield, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 pt-14 pb-8 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CareConnect AI</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Transforming healthcare triage through AI-powered insights and seamless patient-doctor connections.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-3.5 h-3.5 mr-2 text-emerald-500" /> HIPAA Compliant Platform
              </div>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Activity className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 99.9% Uptime SLA
              </div>
            </div>
          </div>

          {/* Patient Portal */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Patient Portal</h4>
            <ul className="space-y-3">
              <li><Link to="/patient/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/find-doctors" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Find Doctors</Link></li>
              <li><Link to="/patient/calendar" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">My Calendar</Link></li>
              <li><Link to="/patient/settings" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Patient Settings</Link></li>
              <li><Link to="/patient/signup" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Sign Up / Login</Link></li>
            </ul>
          </div>

          {/* Doctor Portal */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Doctor Portal</h4>
            <ul className="space-y-3">
              <li><Link to="/doctor/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/doctor/patients" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">My Patients</Link></li>
              <li><Link to="/doctor/calendar" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Appointment Calendar</Link></li>
              <li><Link to="/doctor/settings" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Doctor Settings</Link></li>
              <li><Link to="/doctor/signup" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Doctor Sign Up</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Contact & Support</h4>
            <ul className="space-y-3">
              <li className="text-slate-500 dark:text-slate-400 text-sm flex items-center">
                <Mail className="w-3.5 h-3.5 mr-2 text-indigo-400 flex-shrink-0" /> support@careconnect.ai
              </li>
              <li className="text-slate-500 dark:text-slate-400 text-sm flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-indigo-400 flex-shrink-0" /> 1-800-CARE-AI
              </li>
              <li className="mt-4">
                <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm block">Home</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm">© 2026 CareConnect AI. All rights reserved.</p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
