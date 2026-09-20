import { useState } from 'react';
import {
  ArrowLeft,
  User,
  Users,
  ShieldCheck,
  Share2,
  Plus,
  Calendar,
  MapPin,
  ThumbsUp,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Club } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import MemberManager from './MemberManager';

interface ClubDetailProps {
  club: Club;
  currentUser: any;
  onBack: () => void;
  onToggleJoin: (id: string) => void;
  onSaveClub: (updates: Partial<Club>) => Promise<void>;
  onDeleteClub: (id: string) => Promise<void>;
  onAddToast: (message: string, type?: 'success' | 'info') => void;
}

export default function ClubDetail({ club, currentUser, onBack, onToggleJoin, onSaveClub, onDeleteClub, onAddToast }: ClubDetailProps) {
  const { canManage } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState<{ [key: number]: number }>({});
  const [hasLiked, setHasLiked] = useState<{ [key: number]: boolean }>({});
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
  const isCreator = currentUser && club.created_by && currentUser.id === club.created_by;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(club.name);
  const [editDescription, setEditDescription] = useState(club.description);
  const [editCategory, setEditCategory] = useState(club.category);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const { clubMembers, addClubLead, removeClubLead } = useApp();

  const handleSave = async () => {
    await onSaveClub({ name: editName, description: editDescription, category: editCategory });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDeleteClub(club.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditName(club.name);
    setEditDescription(club.description);
    setEditCategory(club.category);
    setIsEditing(false);
  };

  const handleLike = (index: number, initialLikes: number) => {
    if (hasLiked[index]) {
      setLikesCount(prev => ({ ...prev, [index]: (likesCount[index] ?? initialLikes) - 1 }));
      setHasLiked(prev => ({ ...prev, [index]: false }));
    } else {
      setLikesCount(prev => ({ ...prev, [index]: (likesCount[index] ?? initialLikes) + 1 }));
      setHasLiked(prev => ({ ...prev, [index]: true }));
      onAddToast('You liked this post!', 'success');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    onAddToast('Club link copied to clipboard!', 'success');
  };

  // Generate some high quality random members images for the grid
  const memberAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
  ];

  // If the club doesn't have custom properties, use high-fidelity default ones
  const tags = club.tags ?? [club.category, 'Community', 'Campus Life', 'Atria'];
  const equipmentAccess = club.equipmentAccess ?? 'Standard booking via student portal';
  const weeklyMeetings = club.weeklyMeetings ?? 'Tuesdays @ 5:00 PM';
  
  const leadership = (club.leadership && club.leadership.length > 0) ? club.leadership : [
    {
      name: 'Sarah Chen',
      role: 'President & Creative Director',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      desc: 'Senior Media Arts student. Passionate about visual storytelling and community build.'
    },
    {
      name: 'Marcus Thorne',
      role: 'Technical Operations Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      desc: 'Audio-visual enthusiast with 4 years of experience in live broadcast setups.'
    }
  ];

  const upcomingHappening = club.upcomingHappening ?? {
    name: 'Introductory Meetup & Setup Sprint',
    description: 'Come meet the core leadership, explore our roadmap for the semester, and learn how you can contribute to active projects.',
    date: 'October 24, 2026',
    location: 'Studio B, Building 4',
    image: club.image,
    attendingCount: 42
  };

  const recentActivity = club.recentActivity ?? [
    {
      author: leadership[0].name,
      time: '2 HOURS AGO',
      text: 'Check out the final cut of our latest student documentary on campus wildlife! Premiering this Friday.',
      likes: 24,
      avatar: leadership[0].avatar
    },
    {
      author: club.name,
      time: 'YESTERDAY',
      text: 'We just secured three new equipment items for the workspace. Training sessions open next week.',
      likes: 45,
      avatar: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=150'
    }
  ];

  const resources = club.resources ?? [
    'Workspace Reservation Portal',
    'Development Guideline v2.4',
    'Brand Identity Kit',
    'Alumni Network'
  ];

  return (
    <div className="space-y-6">
      {/* Back Button and Path navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans">
          <span className="hover:text-slate-600 cursor-pointer" onClick={onBack}>Clubs</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[#9E2A2B] font-bold">{club.name}</span>
        </div>
      </div>

      {/* Main Details Container Card */}
      <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
        {/* Cover Image banner */}
        <div className="h-64 sm:h-72 w-full relative bg-slate-100">
          <img
            src={club.image}
            alt={club.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Club Profile card overlap header */}
        <div className="px-6 pb-6 relative z-10 -mt-10 sm:-mt-12">
          <div className="bg-white rounded-2xl p-6 border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Club Avatar Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-[#F1F5F9] shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={club.logo || club.image}
                  alt={club.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Title & Members info */}
              <div className="space-y-1 sm:space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {club.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold font-sans">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-slate-400" /> {club.membersCount.toLocaleString()} Members
                  </span>
                  <span className="flex items-center gap-1 text-[#16A34A]">
                    <ShieldCheck className="w-4 h-4" /> Verified Official Club
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              {canManage && (
                isEditing ? (
                  <>
                    <button onClick={handleCancel} className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-full bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setShowMemberManager(true)} className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Manage Leads
                    </button>
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit Club
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )
              )}
              <button
                onClick={() => {
                  onToggleJoin(club.id);
                  onAddToast(club.joined ? `Left ${club.name}` : `Welcome to ${club.name}! You are now a member.`, 'success');
                }}
                className={`px-6 py-2.5 rounded-full font-bold text-xs tracking-wide transition-all duration-150 cursor-pointer ${
                  club.joined
                    ? 'bg-slate-100 border border-slate-250 text-slate-600 hover:bg-slate-200'
                    : 'bg-[#9E2A2B] hover:bg-[#802223] text-white shadow-md'
                }`}
              >
                {club.joined ? '✓ Joined' : 'Join Club'}
              </button>
              
              <button
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  onAddToast(isFollowing ? `Unfollowed ${club.name}` : `Following ${club.name} updates!`, 'info');
                }}
                className={`px-5 py-2.5 rounded-full font-bold text-xs transition-colors border cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-50 border-slate-300 text-slate-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {isFollowing ? '✓ Following' : 'Follow'}
              </button>

              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-colors focus:outline-none cursor-pointer shrink-0"
                title="Share Club"
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content body layout - 2 Columns */}
        <div className="p-6 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50/20">
          
          {/* LEFT COLUMN: About, Leadership, Happening (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Section */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-2xs">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">About the Collective</h2>
              {isEditing ? (
                <div className="space-y-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold text-slate-800" placeholder="Club name" />
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold text-slate-800 cursor-pointer">
                    <option value="Technology">Technology</option>
                    <option value="Arts">Arts</option>
                    <option value="Environment">Environment</option>
                    <option value="Business">Business</option>
                    <option value="Social">Social</option>
                  </select>
                  <textarea rows={4} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold text-slate-800 resize-none" placeholder="Club description" />
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{club.description}</p>
              )}
              
              {/* Category Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold font-sans ${
                      idx === tags.length - 1
                        ? 'border border-[#9E2A2B]/30 bg-[#FDF2F2] text-[#9E2A2B]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Info grid box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div className="bg-[#FAFAFA] border border-slate-200/60 p-4 rounded-xl">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">Equipment Access</span>
                  <span className="text-xs font-extrabold text-slate-800">{equipmentAccess}</span>
                </div>
                <div className="bg-[#FAFAFA] border border-slate-200/60 p-4 rounded-xl">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">Weekly Meetings</span>
                  <span className="text-xs font-extrabold text-slate-800">{weeklyMeetings}</span>
                </div>
              </div>
            </div>

            {/* Leadership Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Leadership</h2>
                <button
                  onClick={() => onAddToast('Viewing full leadership roster...', 'info')}
                  className="text-xs font-bold text-[#9E2A2B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              {/* Leaders Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {leadership.map((leader, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-slate-150 p-4 shadow-2xs relative flex flex-col justify-between space-y-3 h-full group hover:border-[#9E2A2B]/20 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <img
                        src={leader.avatar}
                        alt={leader.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => onAddToast(`Send message to ${leader.name}`, 'info')}
                        className="p-1.5 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Contact Leader"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-[#9E2A2B] transition-colors">
                        {leader.name}
                      </h3>
                      <h4 className="text-[10px] font-bold text-[#9E2A2B] uppercase tracking-wider">
                        {leader.role}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium pt-1">
                        {leader.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Happenings Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Upcoming Happenings</h2>
                <button
                  onClick={() => onAddToast('Redirecting to Event Creation portal...', 'info')}
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-extrabold text-slate-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Event
                </button>
              </div>

              {/* Featured Event Card */}
              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 p-5">
                
                {/* Event Image */}
                <div className="md:col-span-5 h-48 md:h-full rounded-xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={upcomingHappening.image}
                    alt={upcomingHappening.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Event details block */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-[#FDF2F2] text-[#9E2A2B] border border-[#9E2A2B]/10 uppercase">
                        Featured
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {upcomingHappening.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {upcomingHappening.description}
                    </p>
                  </div>

                  {/* Date, Location, RSVP info */}
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block leading-none mb-0.5">Date</span>
                          <span className="text-[11px] font-bold text-slate-700">{upcomingHappening.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block leading-none mb-0.5">Location</span>
                          <span className="text-[11px] font-bold text-slate-700">{upcomingHappening.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {memberAvatars.slice(0, 3).map((av, idx) => (
                            <img
                              key={idx}
                              className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover"
                              src={av}
                              alt="attending user"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 font-sans">
                          +{upcomingHappening.attendingCount} attending
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setRsvpConfirmed(!rsvpConfirmed);
                          onAddToast(rsvpConfirmed ? 'RSVP Cancelled' : 'RSVP Confirmed! See you there.', 'success');
                        }}
                        className={`px-5 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                          rsvpConfirmed
                            ? 'bg-slate-100 border border-slate-200 text-slate-600'
                            : 'bg-[#9E2A2B] hover:bg-[#802223] text-white shadow-xs'
                        }`}
                      >
                        {rsvpConfirmed ? '✓ RSVP Registered' : 'RSVP Now'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Recent Activity, Top Members, Collective Resources (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></div>
                <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                  Recent Activity
                </h2>
              </div>

              {/* Activity posts list */}
              <div className="space-y-4">
                {recentActivity.map((act, index) => {
                  const currentLikes = likesCount[index] ?? act.likes;
                  const userLiked = hasLiked[index] ?? false;

                  return (
                    <div key={index} className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={act.avatar}
                          alt={act.author}
                          className="w-8 h-8 rounded-full object-cover border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-extrabold text-slate-800 block leading-tight">{act.author}</span>
                          <span className="text-[9px] text-slate-400 font-bold block">{act.time}</span>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 font-medium leading-relaxed font-sans text-[11px] pl-1">
                        {act.text}
                      </p>

                      <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold font-sans pt-1 border-b border-slate-100/50 pb-2.5">
                        <button
                          onClick={() => handleLike(index, act.likes)}
                          className={`flex items-center gap-1 transition-colors hover:text-[#9E2A2B] cursor-pointer ${
                            userLiked ? 'text-[#9E2A2B]' : 'text-slate-400'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{currentLikes}</span>
                        </button>
                        <button
                          onClick={() => onAddToast(`Join conversation in feed...`, 'info')}
                          className="flex items-center gap-1 transition-colors hover:text-slate-600 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => onAddToast('Loading older updates...', 'info')}
                className="w-full py-1.5 text-center text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Load older posts...
              </button>
            </div>

            {/* Top Members */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                  Top Members
                </h2>
                <button
                  onClick={() => onAddToast('Viewing members gallery...', 'info')}
                  className="text-[10px] font-bold text-[#9E2A2B] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Members Avatar Row/Grid */}
              <div className="grid grid-cols-4 gap-2.5 pt-1">
                {memberAvatars.map((av, idx) => (
                  <div key={idx} className="aspect-square rounded-full overflow-hidden border border-slate-100 bg-slate-50 relative group cursor-pointer">
                    <img
                      src={av}
                      alt="Top Member"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Collective Resources */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ExternalLink className="w-4 h-4 text-[#9E2A2B]" />
                <h2 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                  Collective Resources
                </h2>
              </div>

              {/* Resources list items */}
              <div className="space-y-1.5 font-sans">
                {resources.map((res, index) => (
                  <button
                    key={index}
                    onClick={() => onAddToast(`Accessing external link: "${res}"...`, 'success')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-[#9E2A2B]/10 hover:bg-[#FDF2F2]/20 text-slate-600 hover:text-[#9E2A2B] text-xs font-bold transition-all text-left group cursor-pointer"
                  >
                    <span>{res}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#9E2A2B] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      <MemberManager
        isOpen={showMemberManager}
        onClose={() => setShowMemberManager(false)}
        entityName={club.name}
        entityType="club"
        entityId={club.id}
        members={clubMembers[club.id] || []}
        onAddLead={addClubLead}
        onRemoveLead={removeClubLead}
      />
    </div>
  );
}
