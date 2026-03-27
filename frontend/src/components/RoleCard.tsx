
import { Link } from 'react-router-dom';

interface RoleCardProps {
  title: string;
  icon: React.ReactNode;
  features: string[];
  actionText: string;
  linkTo: string;
  isPrimary?: boolean;
}

export function RoleCard({ title, icon, features, actionText, linkTo, isPrimary = true }: RoleCardProps) {
  return (
    <div className="flex flex-col bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(99,102,241,0.05)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 
        ${isPrimary ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
        {icon}
      </div>
      
      <h3 className="text-2xl font-semibold text-slate-900 mb-4">{title}</h3>
      
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-slate-600">
            <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isPrimary ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
            <span className="font-medium">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link 
        to={linkTo}
        className={`w-full py-3.5 px-6 rounded-xl font-semibold text-center transition-colors duration-200
          ${isPrimary 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'}`}
      >
        {actionText}
      </Link>
    </div>
  );
}
