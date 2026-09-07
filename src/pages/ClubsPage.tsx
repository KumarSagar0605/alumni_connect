import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  User,
  Plus,
  Cpu,
  Palette,
  Crown,
  Leaf,
  TrendingUp,
  Music,
} from 'lucide-react';
import { Club } from '../types';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/Skeleton';
import ClubDetail from '../components/ClubDetail';

const getClubLogo = (id: string, name: string) => {
  switch (id) {
    case 'club-1':
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#EBF8FF] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Cpu className="w-5.5 h-5.5 text-[#0284C7]" />
        </div>
      );
    case 'club-2':
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#FFFBEB] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Palette className="w-5.5 h-5.5 text-[#D97706]" />
        </div>
      );
    case 'club-3':
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#F8FAFC] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Crown className="w-5.5 h-5.5 text-[#1E293B]" />
        </div>
      );
    case 'club-4':
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#F0FDF4] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Leaf className="w-5.5 h-5.5 text-[#16A34A]" />
        </div>
      );
    case 'club-5':
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#EEF2FF] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <TrendingUp className="w-5.5 h-5.5 text-[#4F46E5]" />
        </div>
      );
    case 'club-6':
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#FDF2F8] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Music className="w-5.5 h-5.5 text-[#DB2777]" />
        </div>
      );
    default:
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#FDF2F2] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Users className="w-5.5 h-5.5 text-[#9E2A2B]" />
        </div>
      );
  }
};

export default function ClubsPage() {
  const navigate = useNavigate();
  const { user, canManage } = useAuth();
  const {
    clubs,
    setClubs,
    searchQuery,
    setSearchQuery,
    addToast,
    setIsCreateOpen,
    dataLoading,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [clubSubTab, setClubSubTab] = useState<'explore' | 'feed'>('explore');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    const matchesSubTab = clubSubTab === 'explore' || club.joined;
    return matchesSearch && matchesCategory && matchesSubTab;
  });

  const toggleJoinClub = async (clubId: string) => {
    const target = clubs.find((c) => c.id === clubId);
    if (!target) return;

    const newJoinedStatus = !target.joined;
    const newCount = newJoinedStatus ? target.membersCount + 1 : Math.max(0, target.membersCount - 1);

    try {
      const { error } = await supabase
        .from('clubs')
        .update({ joined: newJoinedStatus, members_count: newCount })
        .eq('id', clubId);

      if (error) throw error;

      setClubs((prev: Club[]) =>
        prev.map((c) => (c.id === clubId ? { ...c, joined: newJoinedStatus, membersCount: newCount } : c))
      );
      addToast(newJoinedStatus ? `Successfully joined ${target.name}!` : `Left ${target.name}.`, newJoinedStatus ? 'success' : 'info');
    } catch (err) {
      console.error('Error joining club:', err);
      addToast('Failed to join club via database', 'info');
    }
  };

  if (selectedClubId) {
    return (
      <div className="space-y-8 pb-12 font-sans text-slate-800">
        <ClubDetail
          club={clubs.find((c) => c.id === selectedClubId) || clubs[0]}
          currentUser={user}
          onBack={() => setSelectedClubId(null)}
          onToggleJoin={toggleJoinClub}
          onSaveClub={async (updates) => {
            try {
              const { error } = await supabase.from('clubs').update(updates).eq('id', selectedClubId);
              if (error) throw error;
              setClubs((prev: Club[]) =>
                prev.map((c) => (c.id === selectedClubId ? { ...c, ...updates } : c))
              );
              addToast('Club updated successfully!', 'success');
            } catch (err: any) {
              addToast(`Failed to update club: ${err.message}`, 'info');
            }
          }}
          onAddToast={addToast}
          onDeleteClub={async (clubId) => {
            try {
              const target = clubs.find((c) => c.id === clubId);
              const { error } = await supabase.from('clubs').delete().eq('id', clubId);
              if (error) throw error;
              setClubs((prev: Club[]) => prev.filter((c) => c.id !== clubId));
              setSelectedClubId(null);
              addToast(`Deleted "${target?.name || 'club'}".`, 'info');
            } catch (err: any) {
              addToast(`Failed to delete club: ${err.message}`, 'info');
            }
          }}
        />
      </div>
    );
  }

  if (dataLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight font-sans">Clubs</h1>
            <p className="text-xs text-slate-500 font-medium font-sans">Discover and join communities that match your passion.</p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-full border border-slate-200/40">
            <button
              onClick={() => setClubSubTab('feed')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold font-sans transition-all cursor-pointer ${
                clubSubTab === 'feed'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Feed
            </button>
            <button
              onClick={() => setClubSubTab('explore')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold font-sans transition-all cursor-pointer ${
                clubSubTab === 'explore'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Explore All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {['All Clubs', 'Academic', 'Arts', 'Sports', 'Tech', 'Wellness', 'Business', 'Photography', 'Gaming'].map((catName) => {
            const catValue = catName === 'All Clubs' ? 'All' : catName;
            const isActive = selectedCategory === catValue;
            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catValue)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-normal transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#9E2A2B] text-white shadow-xs'
                    : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]'
                }`}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {filteredClubs.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-100 p-8 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-800">No clubs in this category yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Be the first to launch a creative cluster or academic group in this vertical!</p>
              {canManage && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" /> Start Cluster
                </button>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => setSelectedClubId(club.id)}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs flex flex-col group h-full relative cursor-pointer hover:shadow-md hover:border-[#9E2A2B]/10 transition-all"
              >
                <div className="h-44 w-full relative overflow-hidden bg-slate-50">
                  <img
                    src={club.image}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute top-3 right-3 bg-white/95 text-slate-800 border border-slate-100 px-3 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm">
                    {club.category}
                  </div>

                  <div className="absolute left-6 bottom-0 translate-y-1/2 z-10">
                    {getClubLogo(club.id, club.name)}
                  </div>
                </div>

                <div className="pt-9 px-6 pb-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#9E2A2B] transition-colors leading-snug">
                        {club.name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-300" /> {club.membersCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {club.description}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClubId(club.id);
                      }}
                      className={`flex-1 py-2.5 rounded-full font-bold text-xs transition-all duration-150 border cursor-pointer ${
                        club.joined
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-xs'
                      }`}
                    >
                      {club.joined ? '✓ Joined' : 'Join Club'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
