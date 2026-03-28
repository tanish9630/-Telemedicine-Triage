
import { Star } from 'lucide-react';

const reviews = [
  {
    name: "Priya Sharma",
    role: "Patient from Mumbai",
    content: "CareConnect AI completely changed how I manage my health. The AI symptom checker was incredibly accurate and saved me hours of waiting at the clinic.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "Dr. Rajesh Gupta",
    role: "General Practitioner, Delhi",
    content: "The triage system on the doctor portal helps me prioritize critical patients before they even step into my clinic. Extremely helpful for busy Indian OPDs.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "Ananya Patel",
    role: "Patient from Bengaluru",
    content: "Scheduling consults and logging vitals through the patient portal is seamless. The interface is beautiful and so easy to use for my entire family.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trusted by Patients & Doctors Across India</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">See how CareConnect AI is transforming healthcare experiences across the country.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(99,102,241,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(99,102,241,0.08)] hover:-translate-y-1">
              <div className="flex space-x-1 mb-6 text-amber-400">
                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-slate-600 mb-8 italic">"{review.content}"</p>
              <div className="flex items-center space-x-4 mt-auto">
                <img src={review.image} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-slate-900">{review.name}</div>
                  <div className="text-sm text-slate-500">{review.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
