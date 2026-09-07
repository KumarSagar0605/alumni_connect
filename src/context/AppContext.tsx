import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Club, Project, Event, Mentor, Message, TrendingItem, Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info';
}

interface AppContextType {
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  mentors: Mentor[];
  setMentors: React.Dispatch<React.SetStateAction<Mentor[]>>;
  trending: TrendingItem[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toasts: ToastItem[];
  addToast: (message: string, type?: 'success' | 'info') => void;
  removeToast: (id: string) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  handleCreateSubmit: (type: 'club' | 'project' | 'event', data: any) => Promise<void>;
  dataLoading: boolean;
  userJoinedProjects: Set<string>;
  setUserJoinedProjects: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, userRole } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [userJoinedProjects, setUserJoinedProjects] = useState<Set<string>>(new Set());

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Authoritative client-side permission check for content management.
   * Fast-path on the cached auth role, then re-validates against the live
   * profiles row so a stale or tampered client state cannot bypass the gate.
   * (Supabase RLS remains the true enforcement layer.)
   */
  const checkManagePermission = async (): Promise<boolean> => {
    if (userRole === 'admin' || userRole === 'head') return true;
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      return data?.role === 'admin' || data?.role === 'head';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsRes, projectsRes, eventsRes, mentorsRes, trendingRes] = await Promise.all([
          supabase.from('clubs').select('*'),
          supabase.from('projects').select('*'),
          supabase.from('events').select('*'),
          supabase.from('mentors').select('*'),
          supabase.from('trending').select('*'),
        ]);

        if (clubsRes.error) console.error('Clubs fetch error:', clubsRes.error.message);
        else if (clubsRes.data) setClubs(clubsRes.data.map((c: any) => ({
          ...c,
          membersCount: c.members_count,
          equipmentAccess: c.equipment_access,
          weeklyMeetings: c.weekly_meetings,
          logo: c.logo || c.image,
        })));

        if (projectsRes.error) console.error('Projects fetch error:', projectsRes.error.message);
        else if (projectsRes.data) {
          const formattedProjects = projectsRes.data.map((p: any) => ({
            ...p,
            clubName: p.club_name,
            needsMentor: p.needs_mentor,
            techStack: p.tech_stack || [],
            milestones: p.milestones || [],
            lead: p.lead || '',
            membersList: [],
            mentorsList: [],
          }));

          // Fetch project mentors with profile data
          const { data: pmData } = await supabase
            .from('project_mentors')
            .select('id, project_id, mentor_id');

          if (pmData && pmData.length > 0) {
            const mentorIds = [...new Set(pmData.map((pm: any) => pm.mentor_id))];
            const { data: mentorProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, user_id')
              .in('id', mentorIds);

            const profileMap = new Map((mentorProfiles || []).map((p: any) => [p.id, p]));

            for (const pm of pmData) {
              const project = formattedProjects.find((p: any) => p.id === pm.project_id);
              const profile = profileMap.get(pm.mentor_id);
              if (project && profile) {
                project.mentorsList.push({
                  id: pm.id,
                  profileId: profile.id,
                  fullName: profile.full_name,
                  avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=9E2A2B&color=fff&size=200`,
                  userId: profile.user_id,
                });
              }
            }
          }

          setProjects(formattedProjects);

        // Fetch project members (real roster) with profile data
        const { data: memberRows } = await supabase
          .from('project_members')
          .select('project_id, profile_id');

        if (memberRows && memberRows.length > 0) {
          const memberProfileIds = [...new Set(memberRows.map((m: any) => m.profile_id))];
          const { data: memberProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', memberProfileIds);

          const memberMap = new Map((memberProfiles || []).map((p: any) => [p.id, p]));

          for (const m of memberRows) {
            const project = formattedProjects.find((p: any) => p.id === m.project_id);
            const profile = memberMap.get(m.profile_id);
            if (project && profile) {
              project.membersList.push({
                profileId: profile.id,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=9E2A2B&color=fff&size=200`,
              });
            }
          }

          setProjects([...formattedProjects]);
        }

        // Fetch project members to track which projects current user has joined.
        // NOTE: project_members.profile_id references profiles.id, NOT the auth
        // user id — resolve the caller's profile row first.
        if (user?.id) {
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (myProfile) {
            const { data: membersData } = await supabase
              .from('project_members')
              .select('project_id')
              .eq('profile_id', myProfile.id);

            const joinedProjects = new Set();
            if (membersData) {
              membersData.forEach((pm: any) => joinedProjects.add(pm.project_id));
            }
            setUserJoinedProjects(joinedProjects);
          }
        }
        }

        if (eventsRes.error) console.error('Events fetch error:', eventsRes.error.message);
        else if (eventsRes.data) setEvents(eventsRes.data.map((e: any) => ({
          ...e,
          date: e.event_date,
          registeredCount: e.registered_count,
        })));

        if (mentorsRes.error) console.error('Mentors fetch error:', mentorsRes.error.message);
        else if (mentorsRes.data) setMentors(mentorsRes.data);

        if (trendingRes.error) console.error('Trending fetch error:', trendingRes.error.message);
        else if (trendingRes.data) setTrending(trendingRes.data);

        if (user?.id) {
          const { data: notifData, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id);
          if (notifError) console.error('Notifications fetch error:', notifError.message);
          else if (notifData) setNotifications(notifData);
        }

        const hasErrors = clubsRes.error || projectsRes.error || eventsRes.error || mentorsRes.error || trendingRes.error;
        if (hasErrors) {
          addToast('Some data could not be loaded from the server.', 'info');
        }
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
        addToast('Network error: Failed to connect to database.', 'info');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCreateSubmit = async (type: 'club' | 'project' | 'event', data: any) => {
    // Client-side enforcement: only admin/head may create clubs, projects, events.
    // Row Level Security on the tables is the authoritative enforcement; this
    // guard fails fast with a clear message instead of a raw DB error.
    if (type === 'club' || type === 'project' || type === 'event') {
      const permitted = await checkManagePermission();
      if (!permitted) {
        addToast('Only admins and appointed heads can create communities content.', 'info');
        return;
      }
    }

    try {
      if (type === 'club') {
        const { data: newClub, error } = await supabase
          .from('clubs')
          .insert([{
            name: data.name,
            category: data.category,
            description: data.description,
            image: data.image,
            logo: data.logo || data.image,
            tag: data.tag,
            tags: data.tags,
            equipment_access: data.equipmentAccess,
            weekly_meetings: data.weeklyMeetings,
            resources: data.resources,
            members_count: data.membersCount,
            joined: data.joined,
          }])
          .select()
          .single();

        if (error) {
          addToast(`Failed to create club: ${error.message}`, 'info');
          return;
        }

        const formattedClub = {
          ...newClub,
          membersCount: newClub.members_count,
          equipmentAccess: newClub.equipment_access,
          weeklyMeetings: newClub.weekly_meetings,
          logo: newClub.logo || newClub.image,
        };
        setClubs((prev) => [formattedClub, ...prev]);
        addToast(`Successfully launched new club: "${data.name}"!`, 'success');
      } else if (type === 'project') {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([{
            name: data.name,
            category: data.category,
            description: data.description,
            club_name: data.clubName,
            badge: data.badge,
            needs_mentor: data.needsMentor,
            progress: data.progress,
            mentored: data.mentored,
            joined: data.joined,
            members: data.members,
            milestones: data.milestones || [],
            tech_stack: data.techStack || [],
            lead: data.lead || '',
          }])
          .select()
          .single();

        if (error) {
          addToast(`Failed to create project: ${error.message}`, 'info');
          return;
        }

        const formattedProject = {
          ...newProject,
          clubName: newProject.club_name,
          needsMentor: newProject.needs_mentor,
          techStack: newProject.tech_stack || [],
          milestones: newProject.milestones || [],
          lead: newProject.lead || '',
          membersList: [],
        };
        setProjects((prev) => [formattedProject, ...prev]);
        addToast(`Successfully started new project: "${data.name}"!`, 'success');
      } else if (type === 'event') {
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert([{
            name: data.name,
            category: data.category,
            description: data.description,
            event_date: data.date,
            image: data.image,
            badge: data.badge,
            time: data.time,
            location: data.location,
            host: data.host,
            registered: data.registered,
            registered_count: data.registeredCount,
          }])
          .select()
          .single();

        if (error) {
          addToast(`Failed to create event: ${error.message}`, 'info');
          return;
        }

        const formattedEvent = {
          ...newEvent,
          date: newEvent.event_date,
          registeredCount: newEvent.registered_count,
        };
        setEvents((prev) => [formattedEvent, ...prev]);
        addToast(`Successfully scheduled new event: "${data.name}"!`, 'success');
      }
    } catch (err) {
      console.error(`Error creating ${type}:`, err);
      addToast(`An unexpected error occurred while saving ${type}. Please try again.`, 'info');
    }
  };

  return (
    <AppContext.Provider value={{
      clubs, setClubs,
      projects, setProjects,
      events, setEvents,
      messages, setMessages,
      mentors, setMentors,
      trending,
      notifications, setNotifications,
      searchQuery, setSearchQuery,
      toasts, addToast, removeToast,
      isCreateOpen, setIsCreateOpen,
      handleCreateSubmit,
      dataLoading,
      userJoinedProjects, setUserJoinedProjects
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
