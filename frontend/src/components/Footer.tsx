
import { HeartPulse, Globe, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-indigo-50 p-1.5 rounded-lg">
                <HeartPulse className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CareConnect</span>
            </div>
            <p className="text-slate-500 mb-6">Transforming healthcare triage through AI-powered insights and seamless patient-doctor connections.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Globe className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Mail className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Phone className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Patient Portal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">AI Symptom Checker</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Schedule Consultation</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Medical Records</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Doctor Portal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Patient Queue</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">AI Triage Insights</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">NMC Verification</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="text-slate-500">support@careconnect.ai</li>
              <li className="text-slate-500">1-800-CARE-AI</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm mb-4 md:mb-0">© 2026 CareConnect AI. All rights reserved.</p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
