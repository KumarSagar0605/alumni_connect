import React,{ useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  FileText,
  Download,
  ChevronRight,
  Sparkles,
  Info,
  Bookmark,
  ExternalLink,
  Star,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { Event } from '../types';

interface EventDetailProps {
  event: Event;
  allEvents: Event[];
  currentUser: any;
  onBack: () => void;
  onToggleRegister: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onNavigateToClub: (clubName: string) => void;
  onSaveEvent: (updates: Partial<Event>) => Promise<void>;
  onAddToast: (message: string, type?: 'success' | 'info') => void;
}

export default function EventDetail({
  event,
  allEvents,
  currentUser,
  onBack,
  onToggleRegister,
  onSelectEvent,
  onNavigateToClub,
  onSaveEvent,
  onAddToast
}: EventDetailProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const isCreator = currentUser && event.created_by && currentUser.id === event.created_by;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(event.name);
  const [editDescription, setEditDescription] = useState(event.description);
  const [editDate, setEditDate] = useState(event.date);
  const [editCategory, setEditCategory] = useState(event.category);
  const [editLocation, setEditLocation] = useState(event.location || '');

  const handleSave = async () => {
    await onSaveEvent({ name: editName, description: editDescription, date: editDate, category: editCategory, location: editLocation });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(event.name);
    setEditDescription(event.description);
    setEditDate(event.date);
    setEditCategory(event.category);
    setEditLocation(event.location || '');
    setIsEditing(false);
  };

  // Generate dynamic/mock agenda items based on event id
  const getAgenda = () => {
    if (event.id === 'event-0') {
      return [
        {
          time: '5:30 PM',
          title: 'Welcome Reception',
          description: 'Networking and refreshments in the Grand Hall Foyer.'
        },
        {
          time: '6:00 PM',
          title: 'Keynote: The Ethics of AI',
          description: 'A deep dive into the moral implications of algorithmic decision-making.'
        },
        {
          time: '7:00 PM',
          title: 'Panel Discussion',
          description: 'Interdisciplinary debate featuring all three guest speakers.'
        },
        {
          time: '7:45 PM',
          title: 'Q&A Session',
          description: 'Open floor for student questions and closing remarks.'
        }
      ];
    }

    // Default agenda for other events
    return [
      {
        time: 'Doors Open',
        title: 'Check-in & Registration',
        description: 'Verify your spot, collect badges, grab light refreshments, and secure a seat.'
      },
      {
        time: '+30 Minutes',
        title: 'Introductory Speech & Welcome Notes',
        description: 'Opening remarks by the organizing team and guest overview.'
      },
      {
        time: '+90 Minutes',
        title: 'Main Interactive Session',
        description: 'Engage in workshops, competitive challenges, live demonstrations, or performances.'
      },
      {
        time: 'Wrap-up',
        title: 'Open Panel, Q&A, & Peer Networking',
        description: 'Interact with organizers, take group photographs, and collect resource kits.'
      }
    ];
  };

  // Generate dynamic/mock speakers based on event id
  const getSpeakers = () => {
    if (event.id === 'event-0') {
      return [
        {
          name: 'Dr. Elena Rodriguez',
          role: 'Director of AI Ethics at TechGlobal Institute',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
          desc: 'Dr. Rodriguez has spent over 15 years researching the intersection of machine learning and human rights. She was previously a Senior Advisor to the UN.'
        },
        {
          name: 'Marcus Chen',
          role: 'Lead Architect at FutureBot Systems',
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
          desc: 'As the lead architect of FutureBot\'s latest neural processor, Marcus brings a technical perspective to the discussion on automation feasibility.'
        }
      ];
    }

    // Generic fallback speaker based on event host
    return [
      {
        name: 'Sarah Chen',
        role: `Lead Facilitator, ${event.host || 'Atria Collective'}`,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        desc: 'Academic representative and experienced project coordinator leading campus activities and community programs.'
      }
    ];
  };

  // Resources list matching the design mock
  const resources = [
    {
      title: 'Speaker Presentation Slides',
      meta: 'PDF • 12.4 MB',
      id: 'res-slide-1'
    },
    {
      title: 'AI Ethics Whitepaper 2024',
      meta: 'PDF • 4.8 MB',
      id: 'res-paper-2'
    },
    {
      title: 'Automation Impact Report',
      meta: 'DOCX • 2.1 MB',
      id: 'res-report-3'
    },
    {
      title: 'Event Discussion Guide',
      meta: 'PDF • 1.5 MB',
      id: 'res-guide-4'
    }
  ];

  // Map host name to a potential club ID for premium inter-app navigation
  const handleHostClick = () => {
    onNavigateToClub(event.host || 'Atria Tech Club');
  };

  // Filter 3 related/other events
  const relatedEvents = allEvents
    .filter((e) => e.id !== event.id)
    .slice(0, 3);

  // Helper date mapper for Related Events list (e.g. "Oct 24, 2024" -> "Oct 24")
  const getShortDate = (dateStr: string) => {
    const parts = dateStr.split(',');
    if (parts.length > 0) {
      return parts[0].trim(); // Returns "Oct 24"
    }
    return 'Upcoming';
  };

  return (
    <div className="space-y-6 animate-fade-in" id="event-detail-container">
      {/* 1. HERO BANNER OVERLAY CARD */}
      <div className="relative h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-md border border-slate-200/60 group">
        <img
          src={event.image}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Dark subtle gradient overlay to ensure perfect contrast for white texts */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/45 to-transparent" />

        {/* Floating Back Button */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/45 hover:bg-slate-950/65 text-white text-xs font-bold border border-white/10 shadow-xs backdrop-blur-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </button>
          {isCreator && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 cursor-pointer flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 rounded-full bg-white text-[#9E2A2B] text-xs font-bold border border-white shadow-xs cursor-pointer flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 cursor-pointer flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit Event
                </button>
              )}
            </div>
          )}
        </div>

        {/* Text Details Container on the Bottom Left */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3.5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-sm">
              Featured Series
            </span>
            {isEditing ? (
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold rounded-md border border-white/20 focus:outline-none cursor-pointer">
                <option value="Technology" className="text-slate-800">Technology</option>
                <option value="Arts" className="text-slate-800">Arts</option>
                <option value="Environment" className="text-slate-800">Environment</option>
                <option value="Business" className="text-slate-800">Business</option>
                <option value="Social" className="text-slate-800">Social</option>
              </select>
            ) : (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold rounded-md uppercase tracking-wider border border-white/10">
                {event.category}
              </span>
            )}
          </div>

          {isEditing ? (
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-xl sm:text-2xl md:text-3.5xl font-black tracking-tight focus:outline-none focus:bg-white/20" placeholder="Event name" />
          ) : (
            <h1 className="text-xl sm:text-2xl md:text-3.5xl font-black tracking-tight leading-tight max-w-4xl font-sans text-shadow-sm">
              {event.name}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[11px] sm:text-xs font-bold text-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
              {isEditing ? (
                <input value={editDate} onChange={(e) => setEditDate(e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none w-32" placeholder="Date" />
              ) : (
                <span>{getShortDate(event.date)}, 2024</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{event.date.includes('•') ? event.date.split('•')[1].trim() : '5:30 PM - 8:00 PM'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              {isEditing ? (
                <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none w-40" placeholder="Location" />
              ) : (
                <span>{event.location || 'Atria Grand Hall & Virtual (Hybrid)'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ABOUT, AGENDA, SPEAKERS, DOWNLOADS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* ABOUT THE EVENT SECTION */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8 shadow-2xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
              <Info className="w-5 h-5 text-[#9E2A2B]" />
              <span>About the Event</span>
            </h2>
            {isEditing ? (
              <textarea rows={5} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold text-slate-800 resize-none" placeholder="Event description" />
            ) : (
              <div className="text-sm text-slate-600 leading-relaxed font-medium space-y-4">
                <p>{event.description}</p>
                <p>
                  Whether you are a specialized student, an enthusiast looking to upgrade your portfolio, or simply curious about these creative methodologies, this collective event provides deep practical learnings, interactive roundtables, and structured mentoring slots. Register to claim credentials and coordinate in advance.
                </p>
              </div>
            )}
          </div>

          {/* EVENT AGENDA SECTION */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-[#9E2A2B]" />
              <span>Event Agenda</span>
            </h2>
            
            {/* Timeline element */}
            <div className="relative pl-6 border-l-2 border-rose-100 space-y-6 ml-3">
              {getAgenda().map((item, index) => (
                <div key={`agenda-${index}`} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#9E2A2B] border-4 border-white shadow-2xs" />
                  
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-[#9E2A2B] uppercase tracking-wider font-sans">
                      {item.time}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURED SPEAKERS SECTION */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-[#9E2A2B]" />
              <span>Featured Speakers</span>
            </h2>

            <div className="space-y-5">
              {getSpeakers().map((speaker, index) => (
                <div
                  key={`speaker-${index}`}
                  className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start transition-all hover:bg-slate-50"
                >
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {speaker.name}
                    </h3>
                    <p className="text-xs font-bold text-[#9E2A2B] tracking-wide uppercase">
                      {speaker.role}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {speaker.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RESOURCES & DOWNLOADS */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8 shadow-2xs space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-[#9E2A2B]" />
              <span>Resources & Downloads</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  onClick={() => onAddToast(`Started downloading: ${res.title}`, 'success')}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-rose-200 hover:bg-rose-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-[#FDF2F2] transition-colors">
                      <FileText className="w-4.5 h-4.5 text-slate-500 group-hover:text-[#9E2A2B] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-snug truncate max-w-[150px] sm:max-w-[200px] group-hover:text-[#9E2A2B] transition-colors">
                        {res.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{res.meta}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-[#9E2A2B] transition-colors" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: BOOKING CONTROLS, ORGANIZER, RELATED EVENTS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* RESERVE SPOT WIDGET */}
          <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-t-[#9E2A2B] p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Reserve Your Spot
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                {event.registered ? '✓ You hold a confirmed booking' : 'Only 12 seats remaining for in-person attendance.'}
              </p>
            </div>

            {/* Attendance avatars row */}
            <div className="inline-flex items-center gap-2.5 bg-slate-50/80 border border-slate-150 px-3 py-2 rounded-xl w-full">
              <Users className="w-4 h-4 text-slate-500" />
              <div className="flex -space-x-1.5">
                <img
                  className="w-5.5 h-5.5 rounded-full border-2 border-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                  alt="attendee"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="w-5.5 h-5.5 rounded-full border-2 border-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                  alt="attendee"
                  referrerPolicy="no-referrer"
                />
                <img
                  className="w-5.5 h-5.5 rounded-full border-2 border-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
                  alt="attendee"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[11px] font-black text-slate-700">
                {event.registeredCount} People Going
              </span>
            </div>

            {/* Action RSVP Trigger */}
            <button
              onClick={() => onToggleRegister(event.id)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                event.registered
                  ? 'bg-rose-50 border-rose-100 text-[#9E2A2B] hover:bg-rose-100/50'
                  : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-xs'
              }`}
            >
              {event.registered ? '✓ RSVP Registered' : 'RSVP Now'}
            </button>

            {/* Calendar & Share Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onAddToast('Event successfully added to your device calendar!', 'success')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  onAddToast('Event link copied to clipboard!', 'success');
                }}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* ORGANIZED BY CARD */}
          <div
            onClick={handleHostClick}
            className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 hover:border-rose-200/80 hover:bg-[#FDF2F2]/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                <Users className="w-5.5 h-5.5 text-[#9E2A2B]" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Organized By</span>
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#9E2A2B] transition-colors">
                  {event.host || 'Atria Tech Club'}
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">3.2k Members • Elite Status</p>
              </div>
            </div>
            <ChevronRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-[#9E2A2B] group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* RELATED EVENTS CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans border-b border-slate-100 pb-2.5">
              Related Events
            </h4>

            <div className="space-y-4">
              {relatedEvents.map((evt) => (
                <div
                  key={`related-${evt.id}`}
                  onClick={() => {
                    onSelectEvent(evt.id);
                    onAddToast(`Showing: ${evt.name}`, 'info');
                    // Scroll details view container smoothly to top
                    const element = document.getElementById('event-detail-container');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-start gap-3 group cursor-pointer"
                >
                  {/* Styled Date Calendar Icon Tag */}
                  <div className="w-12 h-12 rounded-xl bg-rose-50/70 border border-rose-100 flex flex-col items-center justify-center shrink-0 text-center text-[10px] font-black text-[#9E2A2B] group-hover:bg-[#FDF2F2] transition-colors">
                    <span className="uppercase tracking-wider text-[8px] font-extrabold text-slate-400 leading-none">OCT</span>
                    <span className="text-base font-black leading-none mt-1">
                      {event.date.includes('Oct') ? event.date.match(/\d+/)?.[0] || '24' : '24'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h5 className="text-xs font-black text-slate-800 leading-snug group-hover:text-[#9E2A2B] transition-colors line-clamp-2">
                      {evt.name}
                    </h5>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{evt.registeredCount} attending</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
