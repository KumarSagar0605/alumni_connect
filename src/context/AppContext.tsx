import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Club, Project, Event, Mentor, Message, Job, Resource, TrendingItem, Notification } from '../types';
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
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsRes, projectsRes, eventsRes, mentorsRes, jobsRes, resourcesRes, trendingRes] = await Promise.all([
          supabase.from('clubs').select('*'),
          supabase.from('projects').select('*'),
          supabase.from('events').select('*'),
          supabase.from('mentors').select('*'),
          supabase.from('jobs').select('*'),
          supabase.from('resources').select('*'),
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
        }

        if (eventsRes.error) console.error('Events fetch error:', eventsRes.error.message);
        else if (eventsRes.data) setEvents(eventsRes.data.map((e: any) => ({
          ...e,
          date: e.event_date,
          registeredCount: e.registered_count,
        })));

        if (mentorsRes.error) console.error('Mentors fetch error:', mentorsRes.error.message);
        else if (mentorsRes.data) setMentors(mentorsRes.data);

        if (jobsRes.error) console.error('Jobs fetch error:', jobsRes.error.message);
        else if (jobsRes.data) setJobs(jobsRes.data);

        if (resourcesRes.error) console.error('Resources fetch error:', resourcesRes.error.message);
        else if (resourcesRes.data) setResources(resourcesRes.data);

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

        const hasErrors = clubsRes.error || projectsRes.error || eventsRes.error || mentorsRes.error || jobsRes.error || resourcesRes.error || trendingRes.error;
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
          needsMentor: newProject.needs_mentor
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
      jobs, setJobs,
      resources, setResources,
      trending,
      notifications, setNotifications,
      searchQuery, setSearchQuery,
      toasts, addToast, removeToast,
      isCreateOpen, setIsCreateOpen,
      handleCreateSubmit,
      dataLoading
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
