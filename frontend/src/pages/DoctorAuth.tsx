import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope, ChevronRight, Loader2, Mail, Lock, User, FileText, Calendar as CalendarIcon, MapPin } from 'lucide-react';

const medicalCouncils = [
  "Andhra Pradesh Medical Council",
  "Arunachal Pradesh Medical Council",
  "Assam Medical Council",
  "Bihar Medical Council",
  "Delhi Medical Council",
  "Gujarat Medical Council",
  "Haryana Medical Council",
  "Himachal Pradesh Medical Council",
  "Jammu & Kashmir Medical Council",
  "Jharkhand Medical Council",
  "Karnataka Medical Council",
  "Kerala Medical Council",
  "Madhya Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Orissa Council of Medical Registration",
  "Punjab Medical Council",
  "Rajasthan Medical Council",
  "Tamil Nadu Medical Council",
  "Uttar Pradesh Medical Council",
  "West Bengal Medical Council"
];

export function DoctorAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      navigate('/doctor/dashboard');
    } else {
      setIsVerifying(true);
      // Simulate NMC Indian Medical Register verification delay
      setTimeout(() => {
        setIsVerifying(false);
        navigate('/doctor/dashboard');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/30 blur-[120px] pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
          {isLogin ? 'Provider Portal Login' : 'Provider Application'}
        </h2>
        <p className="mt-3 text-center text-sm text-slate-500">
          {isLogin ? 'Welcome back, Dr.' : 'Join the CareConnect AI network'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white py-8 px-4 shadow-[0_8px_30px_rgb(99,102,241,0.08)] sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Common fields: Email & Password */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name (as per NMC)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input required type="text" className="block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none border transition-colors" placeholder="Dr. John Doe" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input required type="email" className="block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none border transition-colors" placeholder="doctor@hospital.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input required type="password" className="block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none border transition-colors" placeholder="••••••••" />
              </div>
            </div>

            {/* Verification Fields only for Signup */}
            {!isLogin && (
              <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center mb-1">
                    <ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" /> 
                    NMC Verification
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">We verify all providers against the Indian Medical Register.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Registration Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <input required type="text" className="block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none border transition-colors" placeholder="e.g. 12345" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State Medical Council</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <select required className="block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none border transition-colors appearance-none text-slate-700">
                      <option value="">Select Council</option>
                      {medicalCouncils.map((council) => (
                        <option key={council} value={council}>{council}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Registration</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input required type="number" min="1950" max="2026" className="block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none border transition-colors" placeholder="YYYY" />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying with NMC Registry...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign in to Dashboard' : 'Verify & Create Account'}
                    {!isLogin && <ChevronRight className="w-4 h-4 ml-1" />}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {isLogin ? 'New to CareConnect?' : 'Already verified?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={isVerifying}
                className="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {isLogin ? 'Apply for Provider Access' : 'Sign in to existing account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
