import { TrendingUp, Users, ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
import { Mentor, TrendingItem } from '../types';

interface RightSidebarProps {
  trending: TrendingItem[];
  mentors: Mentor[];
  onLaunchInitiative: () => void;
  onSelectMentor: (mentor: Mentor) => void;
  onExploreMentors: () => void;
  onTrendClick: (trend: string) => void;
}

export default function RightSidebar({
  trending,
  mentors,
  onLaunchInitiative,
  onSelectMentor,
  onExploreMentors,
  onTrendClick
}: RightSidebarProps) {
  const onlineMentors = mentors.filter((m) => m.online);

  return (
    <div className="space-y-6">
      {/* Trending Now Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-[#9E2A2B]" />
            <h3 className="font-bold text-slate-800 text-sm font-sans">Trending Now</h3>
          </div>
          <button
            onClick={() => onTrendClick('all')}
            className="text-xs font-semibold text-[#9E2A2B] hover:text-[#802223] transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Trend List */}
        <div className="space-y-1">
          {trending.map((item) => (
            <button
              key={item.id}
              onClick={() => onTrendClick(item.tag)}
              className="w-full text-left group flex flex-col gap-0.5 hover:bg-slate-50 p-2 rounded-lg transition-all focus:outline-none"
            >
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#9E2A2B] transition-colors">
                {item.tag}
              </span>
              <span className="text-[11px] text-slate-400 font-medium font-sans">{item.detail}</span>
            </button>
          ))}
        </div>

        {/* Hot Initiative Divider & Highlight Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#9E2A2B] text-white text-[9px] font-extrabold rounded-bl-lg">
              HOT
            </div>
            <h4 className="text-xs font-bold text-slate-800 pr-8 line-clamp-2 mb-2 group-hover:text-[#9E2A2B] transition-colors">
              SmartBin Recycling wins Global Award
            </h4>
            <button
              onClick={() => onTrendClick('SmartBin Recycling AI')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E2A2B] hover:text-[#802223] group/btn transition-colors cursor-pointer"
            >
              Read details <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Advisors Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-slate-800 text-sm font-sans">Advisor Pool</h3>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              12 ACTIVE
            </span>
          </div>
        </div>

        {/* Mentors List */}
        <div className="space-y-2 mb-4">
          {onlineMentors.map((mentor) => (
            <button
              key={mentor.id}
              onClick={() => onSelectMentor(mentor)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all group focus:outline-none text-left"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={mentor.avatar_url}
                    alt={mentor.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-[#9E2A2B] transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#9E2A2B] transition-colors">
                    {mentor.full_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{mentor.role}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#9E2A2B] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>

        <button
          onClick={onExploreMentors}
          className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs transition-all text-center focus:outline-none cursor-pointer"
        >
          Browse All Advisors
        </button>
      </div>

      {/* Launch Community / Banner Card */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#9E2A2B] to-[#7F1D1D] p-6 text-white overflow-hidden shadow-md">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex p-2 bg-white/10 rounded-xl border border-white/15">
            <Sparkles className="w-5 h-5 text-rose-200" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base tracking-tight leading-snug">
              Lead Your Community
            </h3>
            <p className="text-xs text-rose-100/80 leading-relaxed font-sans font-medium">
              Start a cluster or project team and sync with senior research leaders.
            </p>
          </div>
          <button
            onClick={onLaunchInitiative}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#9E2A2B] font-bold text-xs transition-all shadow-sm focus:outline-none text-center block cursor-pointer"
          >
            Launch Initiative
          </button>
        </div>
      </div>
    </div>
  );
}

