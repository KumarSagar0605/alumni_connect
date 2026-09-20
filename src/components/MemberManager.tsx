// @ts-nocheck
import { useState } from 'react';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityType: 'club' | 'project' | 'event';
  entityId: string;
  members: { id: string; profileId: string; role: string; profile?: { id: string; fullName: string; avatarUrl: string | null; role: string } }[];
  onAddLead: (entityId: string, profileId: string) => void;
  onRemoveLead: (entityId: string, profileId: string) => void;
}

export default function MemberManager({ isOpen, onClose, entityName, entityType, entityId, members, onAddLead, onRemoveLead }: MemberManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const leads = members.filter((m) => m.role === 'lead');

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .or(`full_name.ilike.%${searchQuery}%,contact->>email.ilike.%${searchQuery}%`)
        .limit(10);

      if (data) {
        const leadIds = new Set(leads.map((l) => l.profileId));
        setSearchResults(data.filter((u) => !leadIds.has(u.id)));
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Manage Leads — {entityName}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current Leads */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 mb-2">Current Leads</h3>
            {leads.length === 0 ? (
              <p className="text-xs text-slate-400">No leads assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-200 overflow-hidden flex-shrink-0">
                        {lead.profile?.avatarUrl ? (
                          <img src={lead.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-700 text-[10px] font-bold">
                            {lead.profile?.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{lead.profile?.fullName || 'Unknown'}</span>
                    </div>
                    <button
                      onClick={() => onRemoveLead(entityId, lead.profileId)}
                      className="p-1 hover:bg-red-100 rounded-lg cursor-pointer"
                      title="Remove as lead"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search to Add */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 mb-2">Add Lead</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#9E2A2B]"
                  placeholder="Search by name or email..."
                />
              </div>
              <button
                onClick={searchUsers}
                disabled={searching || !searchQuery.trim()}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-bold">
                            {user.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onAddLead(entityId, user.id);
                        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
                      }}
                      className="px-2 py-1 rounded-lg bg-[#9E2A2B] hover:bg-[#802223] text-white text-[10px] font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Appoint
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
