// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Settings, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/Skeleton';
import MemberManager from '../components/MemberManager';

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const { events, eventHosts, dataLoading, addEventLead, removeEventLead } = useApp();
  const [memberManagerEvent, setMemberManagerEvent] = useState<string | null>(null);

  if (!canManage) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Access denied.</p>
        <button onClick={() => navigate('/')} className="mt-3 text-[#9E2A2B] text-sm font-semibold hover:underline cursor-pointer">Go to Feed</button>
      </div>
    );
  }

  if (dataLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Events</h1>
        <p className="text-sm text-slate-500 mt-0.5">Appoint hosts and manage event access</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No events yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const hosts = eventHosts[event.id] || [];
            const leads = hosts.filter((h) => h.role === 'lead');
            return (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                <div className="relative h-24">
                  {event.image ? (
                    <img src={event.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B]" />
                  )}
                  {event.badge && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">{event.badge}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm">{event.name}</h3>
                  <p className="text-slate-500 text-xs mt-1">{event.date}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {event.registeredCount || 0} registered</span>
                    <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> {leads.length} host{leads.length !== 1 ? 's' : ''}</span>
                  </div>
                  {leads.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {leads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white overflow-hidden -ml-1 first:ml-0" title={lead.profile?.fullName}>
                          {lead.profile?.avatarUrl ? (
                            <img src={lead.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-700 text-[8px] font-bold">{lead.profile?.fullName?.charAt(0) || '?'}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => navigate('/events')} className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">View</button>
                    <button onClick={() => setMemberManagerEvent(event.id)} className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1">
                      <Settings className="w-3 h-3" /> Hosts
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {memberManagerEvent && (
        <MemberManager
          isOpen={true}
          onClose={() => setMemberManagerEvent(null)}
          entityName={events.find((e) => e.id === memberManagerEvent)?.name || ''}
          entityType="event"
          entityId={memberManagerEvent}
          members={eventHosts[memberManagerEvent] || []}
          onAddLead={addEventLead}
          onRemoveLead={removeEventLead}
        />
      )}
    </div>
  );
}
