// @ts-nocheck
import { Users, ArrowRight } from 'lucide-react';
import { Community } from '../types';

interface CommunityCardProps {
  community: Community;
  onSelect: (id: string) => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  compact?: boolean;
}

export default function CommunityCard({ community, onSelect, onJoin, onLeave, compact }: CommunityCardProps) {
  if (compact) {
    return (
      <div
        className="bg-white rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer group"
        onClick={() => onSelect(community.id)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
            {community.image ? (
              <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B] flex items-center justify-center">
                <span className="text-white text-xs font-bold">{community.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#9E2A2B] transition-colors">{community.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-400">{community.memberCount || 0} members</span>
              {community.myRole === 'lead' && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase">Lead</span>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#9E2A2B] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(community.id)}
    >
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        {community.image ? (
          <img src={community.image} alt={community.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] via-[#7A1F1F] to-[#5C1A1B]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {community.myRole === 'lead' && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-lg shadow-amber-500/25">
            Lead
          </span>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-extrabold text-white text-lg leading-tight drop-shadow-lg">{community.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{community.description || 'No description yet'}</p>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
              <Users className="w-3 h-3 text-slate-500" />
            </div>
            <span className="font-medium">{community.memberCount || 0} members</span>
          </div>

          {community.isMember ? (
            <button
              onClick={(e) => { e.stopPropagation(); onLeave(community.id); }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[11px] font-bold transition-all cursor-pointer"
            >
              Leave
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
              className="px-3.5 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#802223] text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm shadow-[#9E2A2B]/20"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
