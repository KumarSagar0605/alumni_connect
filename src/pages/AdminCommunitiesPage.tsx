// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/Skeleton';
import CreateCommunityModal from '../components/CreateCommunityModal';
import LeadManager from '../components/LeadManager';

export default function AdminCommunitiesPage() {
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const {
    communities,
    dataLoading,
    createCommunity,
    deleteCommunity,
    addCommunityLead,
    removeCommunityLead,
  } = useApp();

  const [showCreate, setShowCreate] = useState(false);
  const [leadManagerCommunity, setLeadManagerCommunity] = useState<string | null>(null);

  if (!canManage) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">You don't have access to this page.</p>
        <button onClick={() => navigate('/')} className="mt-3 text-[#9E2A2B] text-sm font-semibold hover:underline cursor-pointer">
          Go to Feed
        </button>
      </div>
    );
  }

  if (dataLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Communities</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create communities and appoint leads</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-sm font-semibold cursor-pointer flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Community
        </button>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No communities yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-[#9E2A2B] text-sm font-semibold hover:underline cursor-pointer"
          >
            Create the first community
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => {
            const leads = (community.membersList || []).filter((m) => m.role === 'lead');
            return (
              <div
                key={community.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative h-24">
                  {community.image ? (
                    <img src={community.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B]" />
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm">{community.name}</h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{community.description || 'No description'}</p>

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {community.memberCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> {leads.length} lead{leads.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {leads.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {leads.slice(0, 3).map((lead) => (
                        <div
                          key={lead.id}
                          className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white overflow-hidden -ml-1 first:ml-0"
                          title={lead.profile?.fullName}
                        >
                          {lead.profile?.avatarUrl ? (
                            <img src={lead.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-700 text-[8px] font-bold">
                              {lead.profile?.fullName?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                      ))}
                      {leads.length > 3 && (
                        <span className="text-[10px] text-slate-400 ml-1">+{leads.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/community/${community.id}`)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setLeadManagerCommunity(community.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" /> Leads
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Delete "${community.name}"?`)) return;
                        deleteCommunity(community.id);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCommunityModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createCommunity}
      />

      {leadManagerCommunity && (
        <LeadManager
          isOpen={true}
          onClose={() => setLeadManagerCommunity(null)}
          community={communities.find((c) => c.id === leadManagerCommunity)!}
          onAddLead={addCommunityLead}
          onRemoveLead={removeCommunityLead}
        />
      )}
    </div>
  );
}
