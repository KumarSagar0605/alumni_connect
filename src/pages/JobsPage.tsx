import {
  Cpu,
  Palette,
  TrendingUp,
  Leaf,
  Briefcase,
  Code,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const iconMap: Record<string, React.ComponentType<any>> = {
  Cpu, Palette, TrendingUp, Leaf, Briefcase, Code, Lightbulb,
};

export default function JobsPage() {
  const { jobs, addToast } = useApp();

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Campus & Partner Opportunities</h1>
          <p className="text-xs text-slate-500 font-medium">
            Explore on-campus roles, student research programs, and exclusive partner internship positions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((opportunity) => {
            const Icon = iconMap[opportunity.icon] || Briefcase;
            return (
              <div
                key={opportunity.id}
                className="bg-white border border-slate-150 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-[#FDF2F2] group-hover:border-rose-100 transition-colors">
                      <Icon className="w-5 h-5 text-slate-500 group-hover:text-[#9E2A2B] transition-colors" />
                    </div>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {opportunity.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#9E2A2B] transition-colors">
                      {opportunity.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold tracking-wide uppercase">
                      {opportunity.department}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {opportunity.description}
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-4 text-[11px] font-semibold text-slate-500 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-normal text-[10px] uppercase">Compensation</span>
                      <span className="text-slate-700 font-bold">{opportunity.compensation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-normal text-[10px] uppercase">Commitment</span>
                      <span className="text-slate-700 font-bold">{opportunity.hours}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    addToast(`Application submitted for: ${opportunity.title}!`, 'success');
                  }}
                  className="w-full mt-4 py-2.5 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
