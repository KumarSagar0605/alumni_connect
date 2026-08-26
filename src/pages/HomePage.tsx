import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  ChevronRight,
  Sparkles,
  Clock,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Club, Project, Event } from '../types';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { PageSkeleton } from '../components/Skeleton';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    clubs,
    setClubs,
    projects,
    setProjects,
    events,
    setEvents,
    trending,
    searchQuery,
    setSearchQuery,
    addToast,
    dataLoading,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', 'Academic', 'Arts', 'Sports', 'Tech', 'Wellness', 'Business', 'Photography', 'Gaming'];

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || proj.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const toggleJoinProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const newJoinedStatus = !target.joined;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ joined: newJoinedStatus })
        .eq('id', projectId);

      if (error) throw error;

      setProjects((prev: Project[]) =>
        prev.map((p: Project) => (p.id === projectId ? { ...p, joined: newJoinedStatus } : p))
      );
      addToast(newJoinedStatus ? `You joined "${target.name}". Welcome to the project team!` : `You left "${target.name}".`, newJoinedStatus ? 'success' : 'info');
    } catch (err) {
      console.error('Error joining project:', err);
      addToast('Failed to join project via database', 'info');
    }
  };

  const toggleMentorProject = async (projectId: string) => {
    const target = projects.find((project) => project.id === projectId);
    if (!target) return;

    const mentored = !target.mentored;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ mentored })
        .eq('id', projectId);

      if (error) throw error;

      setProjects((prev: Project[]) =>
        prev.map((project: Project) => (project.id === projectId ? { ...project, mentored } : project))
      );
      addToast(
        mentored ? `Advisor offer sent for "${target.name}".` : `Advisor offer withdrawn for "${target.name}".`,
        mentored ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Error updating mentor offer:', err);
      addToast('Failed to update advisor offer via database', 'info');
    }
  };

  const toggleRegisterEvent = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const newRegisteredStatus = !target.registered;
    const newCount = newRegisteredStatus ? target.registeredCount + 1 : Math.max(0, target.registeredCount - 1);

    try {
      const { error } = await supabase
        .from('events')
        .update({ registered: newRegisteredStatus, registered_count: newCount })
        .eq('id', eventId);

      if (error) throw error;

      setEvents((prev: Event[]) =>
        prev.map((e) => (e.id === eventId ? { ...e, registered: newRegisteredStatus, registeredCount: newCount } : e))
      );
      addToast(newRegisteredStatus ? `Spot reserved for "${target.name}"! Check your email for calendar details.` : `Cancelled reservation for "${target.name}".`, newRegisteredStatus ? 'success' : 'info');
    } catch (err) {
      console.error('Error registering event:', err);
      addToast('Failed to register event via database', 'info');
    }
  };

  if (dataLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search initiatives or advisors..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-sm placeholder-slate-400"
          />
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-sans">
            Discover your community
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-normal">
            Find active clusters, join high-impact collaborations, and sync with senior advisors.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-normal transition-all duration-150 focus:outline-none cursor-pointer ${
                  isSelected
                    ? 'bg-[#9E2A2B] border border-[#9E2A2B] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Trending Section */}
        {trending.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9E2A2B] animate-pulse" />
                <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">Trending Now</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map((item) => (
                <span key={item.id} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">
                  {item.tag} <span className="text-slate-400 font-normal ml-1">{item.detail}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9E2A2B]" />
              <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">Popular Clusters</h2>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigate('/clubs');
              }}
              className="text-xs font-bold text-[#9E2A2B] hover:text-[#802223] flex items-center gap-1 transition-colors cursor-pointer"
            >
              Explore All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredClubs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">No active clusters matching category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredClubs.slice(0, 2).map((club) => (
                  <motion.div
                    layout
                    key={club.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs flex flex-col group h-full"
                  >
                    <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                      <img
                        src={club.image}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 text-slate-700 border border-slate-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                        {club.category}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-[#9E2A2B] transition-colors leading-snug">
                            {club.name}
                          </h3>
                          <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-300" /> {club.membersCount}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">
                          {club.description}
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => toggleJoinClub(club.id)}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all duration-150 border cursor-pointer ${
                            club.joined
                              ? 'bg-slate-50 border-slate-200 text-slate-600'
                              : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-xs'
                          }`}
                        >
                          {club.joined ? '✓ Joined Cluster' : 'Join Cluster'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9E2A2B] animate-pulse" />
              <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">High-Velocity Projects</h2>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigate('/projects');
              }}
              className="text-xs font-bold text-[#9E2A2B] hover:text-[#802223] flex items-center gap-1 transition-colors cursor-pointer"
            >
              Sort & Filter <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">No projects matching criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredProjects.slice(0, 2).map((project) => (
                  <motion.div
                    layout
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs group flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            project.badge === 'Recruiting'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : project.badge === 'Needs Mentor'
                              ? 'bg-rose-50 border-rose-100 text-[#9E2A2B]'
                              : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}
                        >
                          {project.badge}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          in Cluster <span className="text-slate-600 hover:underline cursor-pointer font-bold">{project.clubName}</span>
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E2A2B]">
                        {project.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-[#9E2A2B] transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                        {project.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>Sprint Progress</span>
                        <span className={project.badge === 'Recruiting' ? 'text-emerald-600 font-bold' : 'text-[#9E2A2B] font-bold'}>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${project.badge === 'Recruiting' ? 'bg-emerald-500' : 'bg-[#9E2A2B]'}`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex -space-x-1.5">
                          {project.members.map((avatar, idx) => (
                            <img
                              key={idx}
                              src={avatar}
                              alt="member"
                              className="w-7 h-7 rounded-full border-2 border-white object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold tracking-wide">
                          {project.members.length} members synced
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {project.needsMentor && (
                          <button
                            onClick={() => toggleMentorProject(project.id)}
                            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold transition-all border rounded-xl cursor-pointer ${
                              project.mentored
                                ? 'bg-rose-50 border-rose-100 text-[#9E2A2B]'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            {project.mentored ? '✓ Advisor Offered' : 'Offer Advice'}
                          </button>
                        )}
                        <button
                          onClick={() => toggleJoinProject(project.id)}
                          className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold transition-all border rounded-xl cursor-pointer ${
                            project.joined
                              ? 'bg-slate-100 border-slate-200 text-slate-600 shadow-xs'
                              : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-xs'
                          }`}
                        >
                          {project.joined ? '✓ Joined Project' : 'Join Project'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider border-b border-slate-100 pb-2">Featured Summit</h2>
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 overflow-hidden flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 hover:shadow-xs transition-all group"
            >
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-[#9E2A2B] text-[10px] font-bold rounded-full">
                    {evt.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 group-hover:text-[#9E2A2B] transition-colors leading-snug">
                    {evt.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {evt.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5 text-[#9E2A2B]">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{evt.registeredCount} Reserved</span>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => toggleRegisterEvent(evt.id)}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 border cursor-pointer ${
                      evt.registered
                        ? 'bg-slate-100 border-slate-200 text-slate-600'
                        : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-xs'
                    }`}
                  >
                    {evt.registered ? '✓ Reservation Confirmed' : 'Reserve My Spot'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 h-44 lg:h-full w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-150 relative">
                <img
                  src={evt.image}
                  alt={evt.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
