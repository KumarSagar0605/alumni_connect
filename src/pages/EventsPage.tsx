import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Clock,
  MapPin,
  Calendar,
  SlidersHorizontal,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Sparkles,
} from 'lucide-react';
import { Event } from '../types';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/Skeleton';
import EventDetail from '../components/EventDetail';

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    clubs,
    events,
    setEvents,
    addToast,
    setIsCreateOpen,
    dataLoading,
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventCategory, setEventCategory] = useState('All');
  const [eventViewMode, setEventViewMode] = useState<'list' | 'calendar'>('list');
  const [bookmarkedEvents, setBookmarkedEvents] = useState<string[]>([]);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(23);

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

  if (selectedEventId) {
    return (
      <div className="space-y-8 pb-12 font-sans text-slate-800">
        <EventDetail
          event={events.find((e) => e.id === selectedEventId) || events[0]}
          allEvents={events}
          currentUser={user}
          onBack={() => setSelectedEventId(null)}
          onToggleRegister={toggleRegisterEvent}
          onSelectEvent={setSelectedEventId}
          onNavigateToClub={(clubName) => {
            const matchedClub = clubs.find(c => c.name.toLowerCase().includes(clubName.toLowerCase()) || clubName.toLowerCase().includes(c.name.toLowerCase()));
            if (matchedClub) {
              navigate('/clubs');
            } else {
              addToast(`Opened details for ${clubName}`, 'info');
            }
          }}
          onSaveEvent={async (updates) => {
            try {
              const dbUpdates: any = { ...updates };
              if (updates.date !== undefined) {
                dbUpdates.event_date = updates.date;
                delete dbUpdates.date;
              }
              if (updates.registeredCount !== undefined) {
                dbUpdates.registered_count = updates.registeredCount;
                delete dbUpdates.registeredCount;
              }
              const { error } = await supabase.from('events').update(dbUpdates).eq('id', selectedEventId);
              if (error) throw error;
              setEvents((prev: Event[]) =>
                prev.map((e) => (e.id === selectedEventId ? { ...e, ...updates } : e))
              );
              addToast('Event updated successfully!', 'success');
            } catch (err: any) {
              addToast(`Failed to update event: ${err.message}`, 'info');
            }
          }}
          onAddToast={addToast}
        />
      </div>
    );
  }

  if (dataLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
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

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-extrabold text-[#9E2A2B] tracking-wider uppercase font-sans">
                              {evt.host || 'Atria Collective'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  addToast(`Event link copied to clipboard!`, 'success');
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
                                  addToast(
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

              {filteredEventsForSubview.length > 0 && (
                <button
                  onClick={() => addToast('All current events are loaded.', 'info')}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center select-none"
                >
                  Load More Events
                </button>
              )}
            </div>
          ) : (
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

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#9E2A2B] text-white rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-x-4 translate-y-4 pointer-events-none" />
            <div className="space-y-1">
              <h3 className="text-base font-black tracking-tight leading-snug">Host an Event?</h3>
              <p className="text-xs text-rose-100 font-medium leading-relaxed">
                Empower your community. Create and manage your event details right here.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-[#9E2A2B] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Submit Event</span>
            </button>
          </div>

          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-slate-800 font-sans tracking-wide">October 2024</span>
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={() => addToast('Navigate back is disabled for event demo', 'info')}
                  className="p-1 rounded hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => addToast('Navigate forward is disabled for event demo', 'info')}
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
                      addToast(`Focused on October ${day} in Calendar view.`, 'info');
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

          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-extrabold text-slate-800 font-sans tracking-wide">Featured</span>
              </div>
              <button
                onClick={() => addToast('Listing all featured items.', 'info')}
                className="text-[11px] text-[#9E2A2B] font-extrabold hover:underline cursor-pointer"
              >
                See All
              </button>
            </div>

            <div className="space-y-4">
              {events.slice(0, 3).map((evt) => (
                <div key={`feat-${evt.id}`} className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                  setSelectedEventId(evt.id);
                  addToast(`Showing: ${evt.name}`, 'info');
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
    </div>
  );
}
