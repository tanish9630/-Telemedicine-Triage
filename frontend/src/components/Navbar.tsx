
import { HeartPulse, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-indigo-50 p-1.5 rounded-lg">
            <HeartPulse className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">CareConnect</span>
        </Link>
        <div className="hidden md:flex space-x-8 items-center">
          <a href="#features" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Features</a>
          <a href="#testimonials" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Testimonials</a>
          <div className="flex space-x-4 ml-4">
            <Link to="/patient/signup" className="px-4 py-2 font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
              Patient Login
            </Link>
            <Link to="/doctor/signup" className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm rounded-xl transition-colors">
              Provider Login
            </Link>
          </div>
        </div>
        <button className="md:hidden text-slate-600 hover:text-slate-900">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
