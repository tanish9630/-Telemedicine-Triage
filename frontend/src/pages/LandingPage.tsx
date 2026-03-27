import { User, Stethoscope, HeartPulse } from 'lucide-react';
import { RoleCard } from '../components/RoleCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Testimonials } from '../components/Testimonials';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 pt-16">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/40 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/30 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 md:mb-24">
            <div className="inline-flex items-center justify-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 mb-6">
              <HeartPulse className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700 tracking-wide">Next-Gen Care Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-tight">
              Intelligent Triage & <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Care Routing</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10">
              Choose your portal to access AI-powered symptom analysis, 
              seamless scheduling, and unified patient care management tailored for modern healthcare.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            <RoleCard 
              title="Patient Portal"
              icon={<User className="w-7 h-7" />}
              features={[
                "Check Symptoms with AI",
                "Log Vitals seamlessly",
                "Request Consultation"
              ]}
              actionText="Access Patient Portal"
              linkTo="/patient/signup"
              isPrimary={true}
            />
            
            <RoleCard 
              title="Doctor Portal"
              icon={<Stethoscope className="w-7 h-7" />}
              features={[
                "Patient Prioritization",
                "NMC Verification",
                "Schedule Management"
              ]}
              actionText="Access Doctor Portal"
              linkTo="/doctor/signup"
              isPrimary={false}
            />
          </div>

          {/* Featured Image Section */}
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 border border-slate-200/60 relative group">
            <img 
              src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200&h=600" 
              alt="Medical professionals using tablet" 
              className="w-full h-[400px] md:h-[500px] object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end">
              <div className="p-8 md:p-12 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">Empowering Care Teams</h3>
                <p className="text-slate-200 max-w-xl text-lg">Our intuitive dashboards unify critical patient data, helping triage teams work up to 40% faster with enhanced clarity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">AI-Driven Insights for Better Outcomes</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                CareConnect AI integrates advanced symptom checking with real-time doctor availability. Patients get directed to the right level of care immediately, while doctors receive pre-triaged case summaries before the consultation even begins.
              </p>
              <ul className="space-y-4">
                {['Smart symptom checking in 5 minutes', 'Secure FHIR-compliant data transfer', 'Automated follow-up scheduling'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400 translate-x-4 translate-y-4 rounded-3xl opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&q=80&w=600&h=700" 
                alt="Patient consultation" 
                className="relative rounded-3xl shadow-xl border border-white/50 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <Footer />
    </div>
  );
}
