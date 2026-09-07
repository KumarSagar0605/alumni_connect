// React type declarations are unavailable in this project; keep this component
// buildable until @types/react is installed and configured.
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Users,
  ChevronRight,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Send,
  User,
  Plus,
  Cpu,
  Palette,
  Crown,
  Leaf,
  TrendingUp,
  Music,
  Trophy,
  Camera,
  Gamepad2,
  MapPin,
  Bookmark,
  Share2,
  SlidersHorizontal,
  Star,
  ChevronLeft
} from 'lucide-react';
import { Club, Project, Event, Mentor, Message } from '../types';
import ClubDetail from './ClubDetail';
import EventDetail from './EventDetail';
import Opportunities from '../pages/Opportunities';
import MyProfile from '../pages/MyProfile';
import { supabase } from '../supabaseClient';

interface MainContentProps {
  activeView: string;
  setActiveView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  mentors: Mentor[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onAddToast: (message: string, type?: 'success' | 'info') => void;
  onOpenCreate: () => void;
}

const getClubLogo = (id: string, name: string) => {
  switch (id) {
    case 'club-1': // Atria Robotics
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#EBF8FF] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Cpu className="w-5.5 h-5.5 text-[#0284C7]" />
        </div>
      );
    case 'club-2': // The Arts Guild
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#FFFBEB] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Palette className="w-5.5 h-5.5 text-[#D97706]" />
        </div>
      );
    case 'club-3': // Atria Chess Masters
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#F8FAFC] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Crown className="w-5.5 h-5.5 text-[#1E293B]" />
        </div>
      );
    case 'club-4': // Eco Warriors
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#F0FDF4] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <Leaf className="w-5.5 h-5.5 text-[#16A34A]" />
        </div>
      );
    case 'club-5': // FinTech Society
      return (
        <div className="w-12 h-12 rounded-full border-2 border-white bg-[#EEF2FF] shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <TrendingUp className="w-5.5 h-5.5 text-[#4F46E5]" />
        </div>
      );
    case 'club-6': // The Music Loft
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

export default function MainContent({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  clubs,
  setClubs,
  projects,
  setProjects,
  events,
  setEvents,
  mentors,
  messages,
  setMessages,
  onAddToast,
  onOpenCreate
}: MainContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<'All' | 'Recruiting' | 'Needs Mentor' | 'Joined'>('All');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [clubSubTab, setClubSubTab] = useState<'explore' | 'feed'>('explore');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Event specific states to support the new screen designs
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventCategory, setEventCategory] = useState('All');
  const [eventViewMode, setEventViewMode] = useState<'list' | 'calendar'>('list');
  const [bookmarkedEvents, setBookmarkedEvents] = useState<string[]>([]);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(23);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedClubId(null);
    setSelectedEventId(null);
  }, [activeView]);

  // Categories list
  const categories = ['All', 'Academic', 'Arts', 'Sports', 'Tech', 'Wellness', 'Business', 'Photography', 'Gaming'];

  // Handlers for Joining/Registering
  // Handlers for Joining/Registering via Supabase
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
      onAddToast(newJoinedStatus ? `Successfully joined ${target.name}!` : `Left ${target.name}.`, newJoinedStatus ? 'success' : 'info');
    } catch (err) {
      console.error('Error joining club:', err);
      onAddToast('Failed to join club via database', 'info');
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
      onAddToast(newJoinedStatus ? `You joined "${target.name}". Welcome to the project team!` : `You left "${target.name}".`, newJoinedStatus ? 'success' : 'info');
    } catch (err) {
      console.error('Error joining project:', err);
      onAddToast('Failed to join project via database', 'info');
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
      onAddToast(
        mentored ? `Advisor offer sent for "${target.name}".` : `Advisor offer withdrawn for "${target.name}".`,
        mentored ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Error updating mentor offer:', err);
      onAddToast('Failed to update advisor offer via database', 'info');
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
      onAddToast(newRegisteredStatus ? `Spot reserved for "${target.name}"! Check your email for calendar details.` : `Cancelled reservation for "${target.name}".`, newRegisteredStatus ? 'success' : 'info');
    } catch (err) {
      console.error('Error registering event:', err);
      onAddToast('Failed to register event via database', 'info');
    }
  };
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chatInput }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setMessages(resData.messages);
          setChatInput('');

          // Trigger simulated advisor reply
          setTimeout(() => {
            const replyMsgText = "Understood. Let's schedule a deep-dive sync this week to align targets and review current milestones. Keep up the high-velocity focus!";
            fetch('/api/messages/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sender: selectedMentor ? selectedMentor.name : 'Dr. Elena Vance',
                avatar: selectedMentor
                  ? selectedMentor.avatar
                  : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
                text: replyMsgText,
                isMe: false,
              }),
            })
              .then((resReply) => resReply.json())
              .then((replyData) => {
                if (replyData.success) {
                  setMessages(replyData.messages);
                  onAddToast('New advisor message received!', 'info');
                }
              });
          }, 1200);
        }
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        onAddToast('Failed to send message via database', 'info');
      });
  };

  // Filter lists based on search and selected category pills
  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    const matchesSubTab = clubSubTab === 'explore' || club.joined;
    return matchesSearch && matchesCategory && matchesSubTab;
  });

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || proj.category === selectedCategory;

    let matchesFilter = true;
    if (projectFilter === 'Recruiting') matchesFilter = proj.badge === 'Recruiting';
    else if (projectFilter === 'Needs Mentor') matchesFilter = proj.badge === 'Needs Mentor';
    else if (projectFilter === 'Joined') matchesFilter = proj.joined;

    return matchesSearch && matchesCategory && matchesFilter;
  });

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredEventsForSubview = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
      (evt.location || '').toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
      (evt.host || '').toLowerCase().includes(eventSearchQuery.toLowerCase());

    let matchesCategory = true;
    if (eventCategory !== 'All') {
      if (eventCategory === 'Workshops') {
        matchesCategory = evt.category.toLowerCase() === 'workshop' || evt.category.toLowerCase() === 'sustainability';
      } else if (eventCategory === 'Social') {
        matchesCategory = evt.category.toLowerCase() === 'social gathering' || evt.category.toLowerCase() === 'social';
      } else {
        matchesCategory = evt.category.toLowerCase() === eventCategory.toLowerCase();
      }
    }
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      {/* Search Header for Mobile views / Subviews */}
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

      {/* DASHBOARD VIEW */}
      {activeView === 'home' && (
        <div className="space-y-8">
          {/* Welcome Intro Section */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-sans">
              Discover your community
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-normal">
              Find active clusters, join high-impact collaborations, and sync with senior advisors.
            </p>
          </div>

          {/* Categories Pills */}
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

          {/* Popular Clubs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9E2A2B]" />
                <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">Popular Clusters</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setActiveView('clubs');
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
                      {/* Image Frame */}
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

                      {/* Info body */}
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

          {/* Trending Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9E2A2B] animate-pulse" />
                <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">High-Velocity Projects</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setProjectFilter('All');
                  setActiveView('projects');
                }}
                className="text-xs font-bold text-[#9E2A2B] hover:text-[#802223] flex items-center gap-1 transition-colors cursor-pointer"
              >
                Sort & Filter <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Project Cards */}
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
                      {/* Top Header info */}
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

                      {/* Project abstract info */}
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-[#9E2A2B] transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                          {project.description}
                        </p>
                      </div>

                      {/* Progress slider info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span>Sprint Progress</span>
                          <span className={project.badge === 'Recruiting' ? 'text-emerald-600 font-bold' : 'text-[#9E2A2B] font-bold'}>{project.progress}%</span>
                        </div>
                        {/* Custom visual progress bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${project.badge === 'Recruiting' ? 'bg-emerald-500' : 'bg-[#9E2A2B]'}`}
                          />
                        </div>
                      </div>

                      {/* Team Avatars & Action Button */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                        {/* Member avatars */}
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

                        {/* Button list */}
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

          {/* Upcoming Event Hero Section */}
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
      )}

      {/* CLUBS DIRECTORY VIEW */}
      {activeView === 'clubs' && (
        selectedClubId ? (
          <ClubDetail
            club={clubs.find((c) => c.id === selectedClubId) || clubs[0]}
            onBack={() => setSelectedClubId(null)}
            onToggleJoin={toggleJoinClub}
            onAddToast={onAddToast}
          />
        ) : (
          <div className="space-y-6">
            {/* Header section with sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight font-sans">Clubs</h1>
                <p className="text-xs text-slate-500 font-medium font-sans">Discover and join communities that match your passion.</p>
              </div>
              
              {/* My Feed & Explore All Sub-Tabs */}
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

            {/* Categories Horizontal Selector Row */}
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

            {/* Grid list of all clubs */}
            {filteredClubs.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-100 p-8 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-800">No clubs in this category yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Be the first to launch a creative cluster or academic group in this vertical!</p>
                <button
                  onClick={onOpenCreate}
                  className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" /> Start Cluster
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredClubs.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => setSelectedClubId(club.id)}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs flex flex-col group h-full relative cursor-pointer hover:shadow-md hover:border-[#9E2A2B]/10 transition-all"
                  >
                    {/* Card top half cover image */}
                    <div className="h-44 w-full relative overflow-hidden bg-slate-50">
                      <img
                        src={club.image}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Category tag badge top-right */}
                      <div className="absolute top-3 right-3 bg-white/95 text-slate-800 border border-slate-100 px-3 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm">
                        {club.category}
                      </div>

                      {/* Logo Overlay bottom-left */}
                      <div className="absolute left-6 bottom-0 translate-y-1/2 z-10">
                        {getClubLogo(club.id, club.name)}
                      </div>
                    </div>

                    {/* Card bottom half text area */}
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

                      {/* Action buttons row */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card onClick card trigger
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
        )
      )}

      {/* PROJECTS DIRECTORY VIEW */}
      {activeView === 'projects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Co-Lab Teams</h1>
              <p className="text-xs text-slate-500 font-medium">Join committed sprint groups or offer senior research advice.</p>
            </div>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Launch Project
            </button>
          </div>

          {/* Filters Pill Selection & Search */}
          <div className="space-y-4 bg-white rounded-2xl p-4 border border-slate-200/60 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by initiative or tech stack..."
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-sm placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 font-bold mr-2 text-[11px]">Filter Status:</span>
              {(['All', 'Recruiting', 'Needs Mentor', 'Joined'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProjectFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer border ${
                    projectFilter === filter
                      ? 'bg-[#9E2A2B] border-transparent text-white'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Grid display of projects */}
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
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
                    <span>Progress Tracker</span>
                    <span className={project.badge === 'Recruiting' ? 'text-emerald-600 font-bold' : 'text-[#9E2A2B] font-bold'}>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${project.progress}%` }} className={`h-full rounded-full transition-all duration-500 ${project.badge === 'Recruiting' ? 'bg-emerald-500' : 'bg-[#9E2A2B]'}`} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENTORS BOARD VIEW */}
      {activeView === 'mentors' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Advisor Pool</h1>
            <p className="text-xs text-slate-500 font-medium">Tap directly into academic chairs, senior scientists, and research advisors.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white border border-slate-150 rounded-2xl p-5 text-center flex flex-col items-center justify-between shadow-xs hover:border-slate-300 transition-all group relative"
              >
                {mentor.online && (
                  <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    ONLINE
                  </span>
                )}

                <div className="space-y-4 pt-4">
                  <div className="relative inline-block">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-18 h-18 rounded-full object-cover border border-slate-200 shadow-sm mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-[#9E2A2B] transition-colors leading-snug">
                      {mentor.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold tracking-tight mt-1">{mentor.role}</p>
                  </div>
                </div>

                <div className="pt-6 w-full space-y-2">
                  <button
                    onClick={() => {
                      setSelectedMentor(mentor);
                      onAddToast(`Initiating connection with ${mentor.name}...`, 'info');
                      setActiveView('messages');
                    }}
                    className="w-full py-2 px-3 bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={() => {
                      onAddToast(`Requested advice session with ${mentor.name}.`, 'success');
                    }}
                    className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Request Sync
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVENTS VIEW */}
      {activeView === 'events' && (
        selectedEventId ? (
          <EventDetail
            event={events.find((e) => e.id === selectedEventId) || events[0]}
            allEvents={events}
            onBack={() => setSelectedEventId(null)}
            onToggleRegister={toggleRegisterEvent}
            onSelectEvent={setSelectedEventId}
            onNavigateToClub={(clubName) => {
              const matchedClub = clubs.find(c => c.name.toLowerCase().includes(clubName.toLowerCase()) || clubName.toLowerCase().includes(c.name.toLowerCase()));
              if (matchedClub) {
                setSelectedClubId(matchedClub.id);
                setActiveView('clubs');
              } else {
                onAddToast(`Opened details for ${clubName}`, 'info');
              }
            }}
            onAddToast={onAddToast}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Main Events feed & controls */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header section with Badge & List/Calendar mode toggle */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-2">
                <div className="inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-[#9E2A2B] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Discover Campus
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Events & Activities</h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Explore workshops, competitions, and social gatherings happening around you.
                </p>
              </div>

              {/* View Mode Toggle Switcher */}
              <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/60 p-1 rounded-xl text-xs font-bold self-start sm:self-auto shadow-xs">
                <button
                  onClick={() => setEventViewMode('list')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    eventViewMode === 'list'
                      ? 'bg-white text-[#9E2A2B] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setEventViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    eventViewMode === 'calendar'
                      ? 'bg-white text-[#9E2A2B] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>
            </div>

            {/* Custom search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={eventSearchQuery}
                onChange={(e) => setEventSearchQuery(e.target.value)}
                placeholder="Search for event names, hosts, or locations..."
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs sm:text-sm font-medium placeholder-slate-400/95 shadow-2xs transition-all"
              />
              {eventSearchQuery && (
                <button
                  onClick={() => setEventSearchQuery('')}
                  className="absolute right-3.5 top-3 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Category pills filter list */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-[11px] font-bold shadow-3xs">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <span>Filters</span>
              </div>
              {['All', 'Technology', 'Arts', 'Sports', 'Workshops', 'Social'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEventCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer border ${
                    eventCategory === cat
                      ? 'bg-[#9E2A2B] border-transparent text-white shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sub-header section with results count and sort */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight uppercase">Upcoming Events</h3>
                <span className="bg-slate-100 border border-slate-200/80 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {filteredEventsForSubview.length} Results
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer select-none">
                Sort by: <span className="text-slate-700 font-extrabold">Date (Newest)</span>
              </div>
            </div>

            {/* Render List View or Calendar View */}
            {eventViewMode === 'list' ? (
              <div className="space-y-6">
                {filteredEventsForSubview.length > 0 ? (
                  filteredEventsForSubview.map((evt) => {
                    const isBookmarked = bookmarkedEvents.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row group animate-fade-in"
                      >
                        {/* Event Left Image section */}
                        <div
                          onClick={() => setSelectedEventId(evt.id)}
                          className="h-44 md:h-auto md:w-52 shrink-0 bg-slate-100 border-r border-slate-100 relative overflow-hidden cursor-pointer"
                        >
                          <img
                            src={evt.image}
                            alt={evt.name}
                            className="w-full h-full object-cover group-hover:scale-101 transition-all duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-bold rounded-md uppercase tracking-wider">
                            {evt.category}
                          </span>
                        </div>

                        {/* Event Right Info Content section */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-extrabold text-[#9E2A2B] tracking-wider uppercase font-sans">
                                {evt.host || 'Atria Collective'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    onAddToast(`Event link copied to clipboard!`, 'success');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                  title="Share Event"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const next = isBookmarked
                                      ? bookmarkedEvents.filter((id) => id !== evt.id)
                                      : [...bookmarkedEvents, evt.id];
                                    setBookmarkedEvents(next);
                                    onAddToast(
                                      isBookmarked ? 'Event removed from bookmarks.' : 'Event bookmarked successfully!',
                                      'success'
                                    );
                                  }}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    isBookmarked
                                      ? 'text-rose-600 hover:bg-rose-50'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                  }`}
                                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Event'}
                                >
                                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-600' : ''}`} />
                                </button>
                              </div>
                            </div>

                            <h3
                              onClick={() => setSelectedEventId(evt.id)}
                              className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#9E2A2B] transition-colors cursor-pointer"
                            >
                              {evt.name}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-500">
                              <div className="flex items-center gap-1 text-[#9E2A2B]">
                                <Clock className="w-3.5 h-3.5 text-[#9E2A2B]/85" />
                                <span>{evt.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{evt.location || 'Main Auditorium'}</span>
                              </div>
                            </div>

                            <p
                              onClick={() => setSelectedEventId(evt.id)}
                              className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 pt-1 cursor-pointer"
                            >
                              {evt.description}
                            </p>
                          </div>

                          {/* Cards Footer with Attendance and RSVP trigger */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100/70">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1.5">
                                <img
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                                  alt="attendee"
                                  referrerPolicy="no-referrer"
                                />
                                <img
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                                  alt="attendee"
                                  referrerPolicy="no-referrer"
                                />
                                <img
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
                                  alt="attendee"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-400">
                                +{evt.registeredCount} others attending
                              </span>
                            </div>

                            <button
                              onClick={() => toggleRegisterEvent(evt.id)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                evt.registered
                                  ? 'bg-rose-50 border-rose-100 text-[#9E2A2B]'
                                  : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-2xs'
                              }`}
                            >
                              {evt.registered ? '✓ RSVP Registered' : 'RSVP Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-slate-150 rounded-2xl p-8 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-600">No events found matching your filter criteria.</p>
                    <button
                      onClick={() => {
                        setEventSearchQuery('');
                        setEventCategory('All');
                      }}
                      className="text-xs text-[#9E2A2B] font-bold underline hover:no-underline"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {/* Center load more action */}
                {filteredEventsForSubview.length > 0 && (
                  <button
                    onClick={() => onAddToast('All current events are loaded.', 'info')}
                    className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center select-none"
                  >
                    Load More Events
                  </button>
                )}
              </div>
            ) : (
              /* INTERACTIVE CALENDAR CONTAINER */
              <div className="space-y-6">
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-2xs">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 font-sans">
                    Interactive Event Map: October 2024
                  </h4>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold">
                    {/* Offset (Oct 2024 starts on Tuesday) */}
                    <div className="aspect-square" />
                    <div className="aspect-square" />
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const hasEventOnDay = [24, 26, 28, 30].includes(day);
                      const isSelected = selectedCalendarDay === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedCalendarDay(day)}
                          className={`aspect-square rounded-full flex flex-col items-center justify-center relative cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#9E2A2B] text-white shadow-xs'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{day}</span>
                          {hasEventOnDay && (
                            <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-[#9E2A2B]'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Details Box */}
                <div className="bg-rose-50/40 border border-rose-100/60 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Focused Day: October {selectedCalendarDay}, 2024
                  </h4>
                  {events.filter((e) => e.date.includes(`Oct ${selectedCalendarDay}`)).length > 0 ? (
                    events
                      .filter((e) => e.date.includes(`Oct ${selectedCalendarDay}`))
                      .map((evt) => (
                        <div key={evt.id} className="bg-white border border-slate-150 p-4 rounded-xl flex items-center justify-between gap-4 shadow-3xs animate-fade-in">
                          <div
                            onClick={() => setSelectedEventId(evt.id)}
                            className="flex items-center gap-3 cursor-pointer group/cal flex-1 min-w-0"
                          >
                            <img src={evt.image} className="w-11 h-11 rounded-lg object-cover shrink-0 group-hover/cal:opacity-90" referrerPolicy="no-referrer" />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-extrabold text-slate-900 group-hover/cal:text-[#9E2A2B] transition-colors truncate">{evt.name}</h5>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{evt.location} • {evt.host}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleRegisterEvent(evt.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border cursor-pointer transition-colors ${
                              evt.registered
                                ? 'bg-rose-50 border-rose-100 text-[#9E2A2B]'
                                : 'bg-[#9E2A2B] text-white border-transparent'
                            }`}
                          >
                            {evt.registered ? '✓ Reserved' : 'RSVP'}
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold italic">No community events scheduled on this day. Click October 24, 26, 28, or 30 to see active events!</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sidebar elements */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Host an Event card */}
            <div className="bg-[#9E2A2B] text-white rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-x-4 translate-y-4 pointer-events-none" />
              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tight leading-snug">Host an Event?</h3>
                <p className="text-xs text-rose-100 font-medium leading-relaxed">
                  Empower your community. Create and manage your event details right here.
                </p>
              </div>
              <button
                onClick={onOpenCreate}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-[#9E2A2B] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Submit Event</span>
              </button>
            </div>

            {/* Calendar Widget panel */}
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold text-slate-800 font-sans tracking-wide">October 2024</span>
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={() => onAddToast('Navigate back is disabled for event demo', 'info')}
                    className="p-1 rounded hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAddToast('Navigate forward is disabled for event demo', 'info')}
                    className="p-1 rounded hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                {/* Oct 2024 offset */}
                <div className="aspect-square" />
                <div className="aspect-square" />
                {Array.from({ length: 31 }, (_, idx) => {
                  const day = idx + 1;
                  const isToday = day === 23;
                  const hasEvent = [24, 26, 28, 30].includes(day);
                  const isSelected = selectedCalendarDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedCalendarDay(day);
                        setEventViewMode('calendar');
                        onAddToast(`Focused on October ${day} in Calendar view.`, 'info');
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-full relative cursor-pointer transition-colors ${
                        isToday
                          ? 'bg-[#9E2A2B] text-white shadow-xs'
                          : isSelected
                          ? 'bg-slate-100 text-slate-900 border border-slate-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="leading-none">{day}</span>
                      {hasEvent && (
                        <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isToday ? 'bg-white' : 'bg-[#9E2A2B]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Today's Focus</span>
                <div className="mt-1 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Hackathon Registration</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Closes at 11:59 PM</p>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-50 text-[#9E2A2B] text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Featured Section */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-extrabold text-slate-800 font-sans tracking-wide">Featured</span>
                </div>
                <button
                  onClick={() => onAddToast('Listing all featured items.', 'info')}
                  className="text-[11px] text-[#9E2A2B] font-extrabold hover:underline cursor-pointer"
                >
                  See All
                </button>
              </div>

              <div className="space-y-4">
                {events.slice(0, 3).map((evt) => (
                  <div key={`feat-${evt.id}`} className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                    setSelectedEventId(evt.id);
                    onAddToast(`Showing: ${evt.name}`, 'info');
                  }}>
                    <img
                      src={evt.image}
                      alt={evt.name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-100 group-hover:scale-102 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#9E2A2B] transition-colors">
                        {evt.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{evt.location || 'Main Auditorium'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-[#9E2A2B] font-extrabold mt-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-[#9E2A2B]" />
                        <span>Trending #1</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join the Community banner */}
            <div className="bg-[#EBF5FF] text-[#1E3A8A] rounded-2xl p-5 flex items-start gap-3.5 border border-blue-100 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-900">Join the Community</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  Get notified about events matching your interests.
                </p>
              </div>
            </div>

          </div>
        </div>
        )
      )}

      {/* MESSAGES / CHAT VIEW */}
      {activeView === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md h-[550px] flex overflow-hidden">
          {/* Active Chats Contacts Column */}
          <div className="w-1/3 border-r border-slate-150 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-150 bg-white">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-sans">Advisor Nodes</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {mentors.slice(0, 3).map((m) => {
                const isSelected = selectedMentor ? selectedMentor.id === m.id : m.id === 'mentor-1';
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMentor(m)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all cursor-pointer focus:outline-none ${
                      isSelected
                        ? 'bg-[#FDF2F2] text-[#9E2A2B] border-transparent shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-100/60 text-slate-600'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={m.avatar} alt={m.name} className="w-8.5 h-8.5 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                      {m.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-[#9E2A2B]' : 'text-slate-800'}`}>{m.name}</h4>
                      <p className={`text-[11px] truncate font-medium mt-0.5 ${isSelected ? 'text-rose-900/70 font-semibold' : 'text-slate-400'}`}>{m.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Window */}
          <div className="flex-1 flex flex-col justify-between bg-slate-50/20">
            {/* Header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-150 flex items-center gap-3">
              <div className="relative">
                <img
                  src={selectedMentor ? selectedMentor.avatar : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'}
                  alt={selectedMentor ? selectedMentor.name : 'Dr. Elena Vance'}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 font-sans">
                  {selectedMentor ? selectedMentor.name : 'Dr. Elena Vance'}
                </h4>
                <p className="text-[10px] text-[#9E2A2B] font-bold tracking-wider mt-0.5 uppercase">
                  LINK ESTABLISHED / SECURE NODE
                </p>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex items-start gap-3 max-w-[85%] ${m.isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  <img
                    src={m.avatar}
                    alt={m.sender}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs border ${
                        m.isMe
                          ? 'bg-[#9E2A2B] text-white border-transparent rounded-tr-none'
                          : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                    <p className={`text-[10px] text-slate-400 font-bold tracking-wide ${m.isMe ? 'text-right' : ''}`}>
                      {m.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-150 flex items-center gap-2">
              <input
                type="text"
                required
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Type a message to ${selectedMentor ? selectedMentor.name.split(' ')[1] : 'Elena'}...`}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white border border-transparent shadow-xs transition-all cursor-pointer focus:outline-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeView === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6 text-slate-800">
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Account Console</h1>
            <p className="text-xs text-slate-500 font-medium">Configure profile meta-data, target badges, and telemetry alerts.</p>
          </div>

          <div className="space-y-5">
            {/* Profile setup */}
            <div className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
                alt="Me"
                className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-950">Pranav Pratap Singh</h3>
                <p className="text-xs text-slate-400 font-medium">pranavpratapsingh039@gmail.com</p>
                <span className="inline-block px-2.5 py-0.5 bg-[#FDF2F2] text-[#9E2A2B] font-bold text-[10px] border border-rose-100 rounded-full uppercase tracking-wider mt-1">
                  Student Node Member
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Pranav Pratap Singh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Campus ID
                </label>
                <input
                  type="text"
                  defaultValue="ATR-2026-039"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            {/* Switch fields */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Preferences</h4>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-150 rounded-xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800">Email Notifications</span>
                  <p className="text-[11px] text-slate-400 font-medium">Receive weekly network reports and event briefs.</p>
                </div>
                <label className="relative flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-[#9E2A2B]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-150 rounded-xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800">Co-Lab Joining Alerts</span>
                  <p className="text-[11px] text-slate-400 font-medium">Instant notifications when members request to join your project sprint.</p>
                </div>
                <label className="relative flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-[#9E2A2B]"></div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onAddToast('Settings successfully updated!', 'success')}
                className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs shadow-xs transition-all cursor-pointer border border-transparent"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPPORTUNITIES VIEW */}
      {activeView === 'opportunities' && (
        <Opportunities onAddToast={onAddToast} setActiveView={setActiveView} />
      )}

      {/* MY PROFILE VIEW */}
      {activeView === 'profile' && (
        <MyProfile onAddToast={onAddToast} />
      )}
    </div>
  );
}
