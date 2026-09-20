// @ts-nocheck
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Sparkles, ArrowRight, Rocket, CalendarDays, Megaphone, TrendingUp, ChevronRight, Clock, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';

type FeedFilter = 'all' | 'clubs' | 'projects' | 'events' | 'updates';

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    clubs, projects, events,
    communities, communityPosts, userCommunities, myLeadCommunities,
    joinCommunity, leaveCommunity,
    createCommunityPost, updateCommunityPost, deleteCommunityPost,
  } = useApp();
  const { canManage } = useAuth();

  const [filter, setFilter] = useState<FeedFilter>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const postableCommunities = useMemo(() => {
    if (canManage) return communities;
    return communities.filter((c) => myLeadCommunities.has(c.id));
  }, [communities, canManage, myLeadCommunities]);

  // Build unified feed items from all sources
  const feedItems = useMemo(() => {
    const items: any[] = [];

    // Community posts
    let posts = [...communityPosts];
    if (selectedCommunity) posts = posts.filter((p) => p.communityId === selectedCommunity);
    posts.forEach((p) => items.push({ type: 'post', data: p, date: new Date(p.createdAt) }));

    // Projects
    if (filter === 'all' || filter === 'projects') {
      projects.forEach((p: any) => items.push({ type: 'project', data: p, date: new Date(p.created_at || Date.now()) }));
    }

    // Events
    if (filter === 'all' || filter === 'events') {
      events.forEach((e) => {
        const eventDate = e.date ? new Date(e.date) : null;
        items.push({ type: 'event', data: e, date: eventDate || new Date(e.date || Date.now()) });
      });
    }

    // Clubs
    if (filter === 'all' || filter === 'clubs') {
      clubs.forEach((c) => items.push({ type: 'club', data: c, date: new Date(c.created_at || Date.now()) }));
    }

    // Sort by date (newest first)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply sub-filter for community posts
    if (filter === 'updates') {
      return items.filter((i) => i.type === 'post');
    }

    return items;
  }, [clubs, projects, events, communityPosts, filter, selectedCommunity]);

  // Sidebar data
  const joinedCommunities = communities.filter((c) => c.isMember);
  const discoverCommunities = communities.filter((c) => !c.isMember);
  const recruitingProjects = projects.filter((p: any) => p.badge === 'Recruiting').slice(0, 3);
  const upcomingEvents = events
    .filter((e) => e.date && new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const filters: { value: FeedFilter; label: string; icon: any }[] = [
    { value: 'all', label: 'All', icon: Sparkles },
    { value: 'clubs', label: 'Clubs', icon: Users },
    { value: 'projects', label: 'Projects', icon: Rocket },
    { value: 'events', label: 'Events', icon: CalendarDays },
    { value: 'updates', label: 'Posts', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#9E2A2B] via-[#7A1F1F] to-[#5C1A1B] rounded-3xl p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute bottom-4 right-24 w-20 h-20 border-2 border-white rounded-full" />
          <div className="absolute top-8 right-40 w-12 h-12 border-2 border-white rounded-full" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-white/70 text-sm mt-1.5 max-w-md">
              Explore clubs, projects, and events — or see what's new in your communities
            </p>
          </div>
          {postableCommunities.length > 0 && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-5 py-2.5 rounded-2xl bg-white text-[#9E2A2B] text-sm font-bold cursor-pointer flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg shadow-black/10"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* Filter */}
            <div className="bg-white rounded-2xl border border-slate-100 p-2">
              {filters.map((f) => {
                const Icon = f.icon;
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2.5 ${
                      active ? 'bg-[#9E2A2B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} /> {f.label}
                  </button>
                );
              })}
            </div>

            {/* Communities */}
            {joinedCommunities.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Communities</h3>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => setSelectedCommunity(null)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      !selectedCommunity ? 'bg-[#9E2A2B]/10 text-[#9E2A2B]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All
                  </button>
                  {joinedCommunities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCommunity(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                        selectedCommunity === c.id ? 'bg-[#9E2A2B]/10 text-[#9E2A2B]' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
                        {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B]" />}
                      </div>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filter */}
          <div className="lg:hidden mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {filters.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filter === f.value ? 'bg-[#9E2A2B] text-white' : 'bg-white border border-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {f.label}
                </button>
              );
            })}
          </div>

          {/* Feed Content */}
          {feedItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Sparkles className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-slate-700 font-bold text-base">Nothing here yet</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                {filter !== 'all' ? `No ${filter} found.` : 'Join a community or check back later.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item, idx) => {
                if (item.type === 'post') {
                  return (
                    <PostCard
                      key={`post-${item.data.id}`}
                      post={item.data}
                      isAuthor={item.data.authorId === user?.id}
                      isLead={myLeadCommunities.has(item.data.communityId)}
                      isAdmin={canManage}
                      onUpdate={updateCommunityPost}
                      onDelete={deleteCommunityPost}
                      onNavigateCommunity={(id) => setSelectedCommunity(id)}
                    />
                  );
                }

                if (item.type === 'project') {
                  const p = item.data;
                  return (
                    <div key={`proj-${p.id}`} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/projects')}>
                      <div className="h-1.5 bg-gradient-to-r from-[#9E2A2B] to-[#C0392B]" />
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B] flex items-center justify-center shadow-sm">
                              <Rocket className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#9E2A2B] uppercase tracking-wider">Project</p>
                              <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            p.badge === 'Recruiting' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            p.badge === 'Needs Mentor' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>{p.badge}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-2 line-clamp-2">{p.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Users className="w-3 h-3" /> {(p.membersList || []).length} members
                          </div>
                          {p.needsMentor && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <UserCheck className="w-3 h-3" /> Needs Mentor
                            </span>
                          )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${p.progress || 0}%` }} className="h-full rounded-full bg-gradient-to-r from-[#9E2A2B] to-[#C0392B] transition-all" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400 font-medium">{p.progress || 0}% complete</span>
                          <span className="text-[10px] text-[#9E2A2B] font-semibold flex items-center gap-1">View <ChevronRight className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === 'event') {
                  const e = item.data;
                  const eventDate = e.date ? new Date(e.date) : null;
                  return (
                    <div key={`event-${e.id}`} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/events')}>
                      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {eventDate && (
                            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-blue-500 uppercase">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="text-lg font-extrabold text-blue-700 leading-tight">{eventDate.getDate()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Event</p>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">{e.name}</h3>
                            <p className="text-slate-500 text-xs mt-1 line-clamp-1">{e.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              {e.location && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {e.location}</span>}
                              <span className="text-[11px] text-slate-400">{e.registeredCount || 0} attending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === 'club') {
                  const c = item.data;
                  return (
                    <div key={`club-${c.id}`} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/clubs')}>
                      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-600" />
                      <div className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                            {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Club</p>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">{c.name}</h3>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-slate-900">{c.memberCount || 0}</p>
                            <p className="text-[10px] text-slate-400">members</p>
                          </div>
                        </div>
                        {c.description && <p className="text-slate-500 text-xs mt-2 line-clamp-1">{c.description}</p>}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 hidden xl:block">
          <div className="sticky top-24 space-y-5">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Events</h3>
                  <button onClick={() => navigate('/events')} className="text-[10px] font-semibold text-[#9E2A2B] hover:underline cursor-pointer">View all</button>
                </div>
                <div className="p-2 space-y-1">
                  {upcomingEvents.map((e) => {
                    const d = e.date ? new Date(e.date) : null;
                    return (
                      <button key={e.id} onClick={() => navigate('/events')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-3">
                        {d && (
                          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-bold text-blue-500 uppercase leading-none">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-sm font-extrabold text-blue-700 leading-tight">{d.getDate()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{e.name}</p>
                          <p className="text-[10px] text-slate-400">{e.registeredCount || 0} attending</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recruiting Projects */}
            {recruitingProjects.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recruiting</h3>
                  <button onClick={() => navigate('/projects')} className="text-[10px] font-semibold text-[#9E2A2B] hover:underline cursor-pointer">View all</button>
                </div>
                <div className="p-2 space-y-1">
                  {recruitingProjects.map((p: any) => (
                    <button key={p.id} onClick={() => navigate('/projects')} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B] flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{(p.membersList || []).length} members</p>
                      </div>
                      {p.needsMentor && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Mentor</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Discover Communities */}
            {discoverCommunities.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Communities</h3>
                </div>
                <div className="p-2 space-y-1">
                  {discoverCommunities.slice(0, 4).map((c) => (
                    <button key={c.id} onClick={() => navigate(`/community/${c.id}`)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                        {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B] flex items-center justify-center"><span className="text-white text-xs font-bold">{c.name.charAt(0)}</span></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.memberCount || 0} members</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); joinCommunity(c.id); }}
                        className="px-2.5 py-1 rounded-lg bg-[#9E2A2B] text-white text-[10px] font-bold cursor-pointer"
                      >
                        Join
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={createCommunityPost}
        communities={postableCommunities}
        defaultCommunityId={selectedCommunity || undefined}
      />
    </div>
  );
}
