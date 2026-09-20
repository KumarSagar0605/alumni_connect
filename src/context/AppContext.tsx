import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Club, Project, Event, Mentor, Message, TrendingItem, Notification, Community, CommunityMember, CommunityPost, ClubMember, EventHost } from '../types';
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
  communities: Community[];
  setCommunities: React.Dispatch<React.SetStateAction<Community[]>>;
  communityPosts: CommunityPost[];
  setCommunityPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  userCommunities: Set<string>;
  setUserCommunities: React.Dispatch<React.SetStateAction<Set<string>>>;
  myLeadCommunities: Set<string>;
  setMyLeadCommunities: React.Dispatch<React.SetStateAction<Set<string>>>;
  createCommunity: (data: { name: string; description: string; image: string }) => Promise<void>;
  updateCommunity: (id: string, data: Partial<Community>) => Promise<void>;
  deleteCommunity: (id: string) => Promise<void>;
  joinCommunity: (communityId: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
  createCommunityPost: (data: {
    communityId: string;
    title: string;
    content: string;
    postType: 'event' | 'announcement' | 'update';
    image?: string;
    eventDate?: string;
  }) => Promise<void>;
  updateCommunityPost: (id: string, data: Partial<CommunityPost>) => Promise<void>;
  deleteCommunityPost: (id: string) => Promise<void>;
  addCommunityLead: (communityId: string, profileId: string) => Promise<void>;
  removeCommunityLead: (communityId: string, profileId: string) => Promise<void>;
  refreshCommunityMembers: (communityId: string) => Promise<void>;
  clubMembers: Record<string, ClubMember[]>;
  eventHosts: Record<string, EventHost[]>;
  addClubLead: (clubId: string, profileId: string) => Promise<void>;
  removeClubLead: (clubId: string, profileId: string) => Promise<void>;
  refreshClubMembers: (clubId: string) => Promise<void>;
  addEventLead: (eventId: string, profileId: string) => Promise<void>;
  removeEventLead: (eventId: string, profileId: string) => Promise<void>;
  refreshEventHosts: (eventId: string) => Promise<void>;
  addProjectLead: (projectId: string, profileId: string) => Promise<void>;
  removeProjectLead: (projectId: string, profileId: string) => Promise<void>;
  refreshProjectMembers: (projectId: string) => Promise<void>;
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
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [userCommunities, setUserCommunities] = useState<Set<string>>(new Set());
  const [myLeadCommunities, setMyLeadCommunities] = useState<Set<string>>(new Set());
  const [clubMembers, setClubMembers] = useState<Record<string, ClubMember[]>>({});
  const [eventHosts, setEventHosts] = useState<Record<string, EventHost[]>>({});

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

        // === COMMUNITIES & COMMUNITY POSTS ===
        const [communitiesRes, postsRes] = await Promise.all([
          supabase.from('communities').select('*'),
          supabase.from('community_posts').select('*'),
        ]);

        if (communitiesRes.error) console.error('Communities fetch error:', communitiesRes.error.message);
        else if (communitiesRes.data) {
          const communityRows = communitiesRes.data;
          // Fetch member counts per community
          const { data: memberCounts } = await supabase
            .from('community_members')
            .select('community_id');

          const countMap: Record<string, number> = {};
          if (memberCounts) {
            memberCounts.forEach((m: any) => {
              countMap[m.community_id] = (countMap[m.community_id] || 0) + 1;
            });
          }

          const formatted = communityRows.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            image: c.image || '',
            createdBy: c.created_by,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            memberCount: countMap[c.id] || 0,
            isMember: false,
            myRole: null,
            membersList: [],
          }));

          setCommunities(formatted);

          // Resolve user's community memberships + lead status
          if (user?.id) {
            const { data: myProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (myProfile) {
              const { data: myMemberships } = await supabase
                .from('community_members')
                .select('community_id, role')
                .eq('profile_id', myProfile.id);

              if (myMemberships) {
                const joinedSet = new Set<string>();
                const leadSet = new Set<string>();
                myMemberships.forEach((m: any) => {
                  joinedSet.add(m.community_id);
                  if (m.role === 'lead') leadSet.add(m.community_id);
                });
                setUserCommunities(joinedSet);
                setMyLeadCommunities(leadSet);

                // Update community cards with membership info
                setCommunities((prev) => prev.map((c) => ({
                  ...c,
                  isMember: joinedSet.has(c.id),
                  myRole: leadSet.has(c.id) ? 'lead' : joinedSet.has(c.id) ? 'member' : null,
                })));
              }
            }
          }
        }

        if (postsRes.error) console.error('Community posts fetch error:', postsRes.error.message);
        else if (postsRes.data) {
          // Fetch author profiles for posts
          const authorIds = [...new Set(postsRes.data.map((p: any) => p.author_id).filter(Boolean))];
          const communityIds = [...new Set(postsRes.data.map((p: any) => p.community_id).filter(Boolean))];

          const [authorRes, communityRes] = await Promise.all([
            authorIds.length > 0
              ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', authorIds)
              : { data: [], error: null },
            communityIds.length > 0
              ? supabase.from('communities').select('id, name').in('id', communityIds)
              : { data: [], error: null },
          ]);

          const authorMap = new Map((authorRes.data || []).map((a: any) => [a.id, {
            id: a.id,
            fullName: a.full_name,
            avatarUrl: a.avatar_url,
          }]));
          const communityMap = new Map((communityRes.data || []).map((c: any) => [c.id, {
            id: c.id,
            name: c.name,
          }]));

          const formattedPosts = postsRes.data.map((p: any) => ({
            id: p.id,
            communityId: p.community_id,
            authorId: p.author_id,
            title: p.title,
            content: p.content || '',
            postType: p.post_type,
            image: p.image || '',
            eventDate: p.event_date,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            author: p.author_id ? authorMap.get(p.author_id) : undefined,
            community: p.community_id ? communityMap.get(p.community_id) : undefined,
          }));

          setCommunityPosts(formattedPosts);
        }

        // === CLUB MEMBERS (lead tracking) ===
        const { data: clubMemberRows } = await supabase
          .from('club_members')
          .select('id, club_id, profile_id, role, joined_at');

        if (clubMemberRows && clubMemberRows.length > 0) {
          const clubProfileIds = [...new Set(clubMemberRows.map((m: any) => m.profile_id))];
          const { data: clubProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', clubProfileIds);

          const clubProfileMap = new Map((clubProfiles || []).map((p: any) => [p.id, p]));
          const clubMembersMap: Record<string, any[]> = {};

          for (const m of clubMemberRows) {
            if (!clubMembersMap[m.club_id]) clubMembersMap[m.club_id] = [];
            const profile = clubProfileMap.get(m.profile_id);
            clubMembersMap[m.club_id].push({
              id: m.id,
              clubId: m.club_id,
              profileId: m.profile_id,
              role: m.role,
              joinedAt: m.joined_at,
              profile: profile ? {
                id: profile.id,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                role: profile.role,
              } : undefined,
            });
          }

          setClubMembers(clubMembersMap);

          // Update clubs with member counts and lead info
          setClubs((prev) => prev.map((c) => {
            const members = clubMembersMap[c.id] || [];
            const leads = members.filter((m: any) => m.role === 'lead');
            return {
              ...c,
              memberCount: members.length,
              leadership: leads.map((l: any) => ({
                name: l.profile?.fullName || 'Unknown',
                role: 'Lead',
                avatar: l.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.profile?.fullName || '?')}&background=9E2A2B&color=fff&size=200`,
                desc: '',
              })),
            };
          }));
        }

        // === EVENT HOSTS ===
        const { data: eventHostRows } = await supabase
          .from('event_hosts')
          .select('id, event_id, profile_id, role, joined_at');

        if (eventHostRows && eventHostRows.length > 0) {
          const eventProfileIds = [...new Set(eventHostRows.map((h: any) => h.profile_id))];
          const { data: eventProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', eventProfileIds);

          const eventProfileMap = new Map((eventProfiles || []).map((p: any) => [p.id, p]));
          const eventHostsMap: Record<string, any[]> = {};

          for (const h of eventHostRows) {
            if (!eventHostsMap[h.event_id]) eventHostsMap[h.event_id] = [];
            const profile = eventProfileMap.get(h.profile_id);
            eventHostsMap[h.event_id].push({
              id: h.id,
              eventId: h.event_id,
              profileId: h.profile_id,
              role: h.role,
              joinedAt: h.joined_at,
              profile: profile ? {
                id: profile.id,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                role: profile.role,
              } : undefined,
            });
          }

          setEventHosts(eventHostsMap);
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

  // === COMMUNITY CRUD HANDLERS ===

  const createCommunity = async (data: { name: string; description: string; image: string }) => {
    const permitted = await checkManagePermission();
    if (!permitted) {
      addToast('Only admins can create communities.', 'info');
      return;
    }
    try {
      // Resolve the current user's profile ID for created_by
      let createdByProfileId: string | null = null;
      if (user?.id) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        createdByProfileId = myProfile?.id || null;
      }

      const { data: newCommunity, error } = await supabase
        .from('communities')
        .insert([{
          name: data.name,
          description: data.description,
          image: data.image,
          created_by: createdByProfileId,
        }])
        .select()
        .single();

      if (error) {
        addToast(`Failed to create community: ${error.message}`, 'info');
        return;
      }

      const formatted = {
        id: newCommunity.id,
        name: newCommunity.name,
        description: newCommunity.description || '',
        image: newCommunity.image || '',
        createdBy: newCommunity.created_by,
        createdAt: newCommunity.created_at,
        updatedAt: newCommunity.updated_at,
        memberCount: 0,
        isMember: false,
        myRole: null,
        membersList: [],
      };
      setCommunities((prev) => [formatted, ...prev]);
      addToast(`Community "${data.name}" created!`, 'success');
    } catch (err) {
      console.error('Error creating community:', err);
      addToast('An unexpected error occurred while creating the community.', 'info');
    }
  };

  const updateCommunity = async (id: string, data: Partial<Community>) => {
    const permitted = await checkManagePermission();
    if (!permitted) {
      addToast('Only admins can update communities.', 'info');
      return;
    }
    try {
      const updates: any = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.image !== undefined) updates.image = data.image;

      const { error } = await supabase.from('communities').update(updates).eq('id', id);
      if (error) throw error;

      setCommunities((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
      addToast('Community updated.', 'success');
    } catch (err: any) {
      addToast(`Failed to update community: ${err.message}`, 'info');
    }
  };

  const deleteCommunity = async (id: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) {
      addToast('Only admins can delete communities.', 'info');
      return;
    }
    try {
      const { error } = await supabase.from('communities').delete().eq('id', id);
      if (error) throw error;
      setCommunities((prev) => prev.filter((c) => c.id !== id));
      setCommunityPosts((prev) => prev.filter((p) => p.communityId !== id));
      addToast('Community deleted.', 'info');
    } catch (err: any) {
      addToast(`Failed to delete community: ${err.message}`, 'info');
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user?.id) return;
    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!myProfile) {
        addToast('Could not find your profile.', 'info');
        return;
      }

      // Check if already a member (idempotent)
      const { data: existing } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('profile_id', myProfile.id)
        .maybeSingle();

      if (existing) {
        setUserCommunities((prev) => new Set(prev).add(communityId));
        addToast('You are already a member of this community.', 'info');
        return;
      }

      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: communityId, profile_id: myProfile.id, role: 'member' });

      if (error) {
        // 23505 = duplicate key: already a member, just sync state
        if ((error as any)?.code === '23505') {
          setUserCommunities((prev) => new Set(prev).add(communityId));
          addToast('You joined the community!', 'success');
          return;
        }
        throw error;
      }

      setUserCommunities((prev) => new Set(prev).add(communityId));
      setCommunities((prev) => prev.map((c) =>
        c.id === communityId ? { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 } : c
      ));
      addToast('You joined the community!', 'success');
    } catch (err: any) {
      addToast(`Failed to join community: ${err.message}`, 'info');
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user?.id) return;
    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!myProfile) return;

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('profile_id', myProfile.id);

      if (error) throw error;

      setUserCommunities((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
      setMyLeadCommunities((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
      setCommunities((prev) => prev.map((c) =>
        c.id === communityId ? { ...c, isMember: false, myRole: null, memberCount: Math.max(0, (c.memberCount || 1) - 1) } : c
      ));
      addToast('You left the community.', 'info');
    } catch (err: any) {
      addToast(`Failed to leave community: ${err.message}`, 'info');
    }
  };

  // === COMMUNITY POST CRUD ===

  const createCommunityPost = async (data: {
    communityId: string;
    title: string;
    content: string;
    postType: 'event' | 'announcement' | 'update';
    image?: string;
    eventDate?: string;
  }) => {
    if (!user?.id) return;
    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!myProfile) {
        addToast('Could not find your profile.', 'info');
        return;
      }

      const { data: newPost, error } = await supabase
        .from('community_posts')
        .insert([{
          community_id: data.communityId,
          author_id: myProfile.id,
          title: data.title,
          content: data.content,
          post_type: data.postType,
          image: data.image || '',
          event_date: data.eventDate || null,
        }])
        .select()
        .single();

      if (error) throw error;

      const { data: community } = await supabase
        .from('communities')
        .select('id, name')
        .eq('id', data.communityId)
        .single();

      const formatted = {
        id: newPost.id,
        communityId: newPost.community_id,
        authorId: newPost.author_id,
        title: newPost.title,
        content: newPost.content || '',
        postType: newPost.post_type,
        image: newPost.image || '',
        eventDate: newPost.event_date,
        createdAt: newPost.created_at,
        updatedAt: newPost.updated_at,
        author: { id: myProfile.id, fullName: user.user_metadata?.full_name || 'User', avatarUrl: null },
        community: community ? { id: community.id, name: community.name } : undefined,
      };

      setCommunityPosts((prev) => [formatted, ...prev]);
      addToast('Post published!', 'success');
    } catch (err: any) {
      addToast(`Failed to create post: ${err.message}`, 'info');
    }
  };

  const updateCommunityPost = async (id: string, data: Partial<CommunityPost>) => {
    try {
      const updates: any = {};
      if (data.title !== undefined) updates.title = data.title;
      if (data.content !== undefined) updates.content = data.content;
      if (data.postType !== undefined) updates.post_type = data.postType;
      if (data.image !== undefined) updates.image = data.image;
      if (data.eventDate !== undefined) updates.event_date = data.eventDate;

      const { error } = await supabase.from('community_posts').update(updates).eq('id', id);
      if (error) throw error;

      setCommunityPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      addToast('Post updated.', 'success');
    } catch (err: any) {
      addToast(`Failed to update post: ${err.message}`, 'info');
    }
  };

  const deleteCommunityPost = async (id: string) => {
    try {
      const { error } = await supabase.from('community_posts').delete().eq('id', id);
      if (error) throw error;
      setCommunityPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('Post deleted.', 'info');
    } catch (err: any) {
      addToast(`Failed to delete post: ${err.message}`, 'info');
    }
  };

  // === COMMUNITY LEAD MANAGEMENT ===

  const addCommunityLead = async (communityId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) {
      addToast('Only admins can appoint leads.', 'info');
      return;
    }
    try {
      // Upsert: if already a member, update role to lead; otherwise insert as lead
      const { data: existing } = await supabase
        .from('community_members')
        .select('id, role')
        .eq('community_id', communityId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        if (existing.role === 'lead') {
          addToast('User is already a lead for this community.', 'info');
          return;
        }
        const { error } = await supabase
          .from('community_members')
          .update({ role: 'lead' })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_members')
          .insert({ community_id: communityId, profile_id: profileId, role: 'lead' });
        if (error) throw error;
      }

      // Refresh community members list
      await refreshCommunityMembers(communityId);
      addToast('Lead appointed!', 'success');
    } catch (err: any) {
      addToast(`Failed to appoint lead: ${err.message}`, 'info');
    }
  };

  const removeCommunityLead = async (communityId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) {
      addToast('Only admins can remove leads.', 'info');
      return;
    }
    try {
      // Demote to member instead of deleting
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'member' })
        .eq('community_id', communityId)
        .eq('profile_id', profileId);
      if (error) throw error;

      await refreshCommunityMembers(communityId);
      addToast('Lead removed.', 'info');
    } catch (err: any) {
      addToast(`Failed to remove lead: ${err.message}`, 'info');
    }
  };

  const refreshCommunityMembers = async (communityId: string) => {
    try {
      const { data: memberRows } = await supabase
        .from('community_members')
        .select('id, community_id, profile_id, role, joined_at')
        .eq('community_id', communityId);

      if (!memberRows) return;

      const profileIds = [...new Set(memberRows.map((m: any) => m.profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', profileIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const membersList: CommunityMember[] = memberRows.map((m: any) => {
        const profile = profileMap.get(m.profile_id);
        return {
          id: m.id,
          communityId: m.community_id,
          profileId: m.profile_id,
          role: m.role,
          joinedAt: m.joined_at,
          profile: profile ? {
            id: profile.id,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
          } : undefined,
        };
      });

      setCommunities((prev) => prev.map((c) =>
        c.id === communityId ? { ...c, membersList, memberCount: membersList.length } : c
      ));
    } catch (err) {
      console.error('Error refreshing community members:', err);
    }
  };

  // === CLUB MEMBER MANAGEMENT ===

  const refreshClubMembers = async (clubId: string) => {
    try {
      const { data: memberRows } = await supabase
        .from('club_members')
        .select('id, club_id, profile_id, role, joined_at')
        .eq('club_id', clubId);

      if (!memberRows) return;

      const profileIds = [...new Set(memberRows.map((m: any) => m.profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', profileIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const members: ClubMember[] = memberRows.map((m: any) => {
        const profile = profileMap.get(m.profile_id);
        return {
          id: m.id,
          clubId: m.club_id,
          profileId: m.profile_id,
          role: m.role,
          joinedAt: m.joined_at,
          profile: profile ? {
            id: profile.id,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
          } : undefined,
        };
      });

      setClubMembers((prev) => ({ ...prev, [clubId]: members }));

      // Update club leadership display
      const leads = members.filter((m) => m.role === 'lead');
      setClubs((prev) => prev.map((c) =>
        c.id === clubId ? {
          ...c,
          memberCount: members.length,
          leadership: leads.map((l) => ({
            name: l.profile?.fullName || 'Unknown',
            role: 'Lead',
            avatar: l.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.profile?.fullName || '?')}&background=9E2A2B&color=fff&size=200`,
            desc: '',
          })),
        } : c
      ));
    } catch (err) {
      console.error('Error refreshing club members:', err);
    }
  };

  const addClubLead = async (clubId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) { addToast('Only admins can appoint leads.', 'info'); return; }
    try {
      const { data: existing } = await supabase
        .from('club_members')
        .select('id, role')
        .eq('club_id', clubId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        if (existing.role === 'lead') { addToast('Already a lead.', 'info'); return; }
        const { error } = await supabase.from('club_members').update({ role: 'lead' }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('club_members').insert({ club_id: clubId, profile_id: profileId, role: 'lead' });
        if (error) throw error;
      }
      await refreshClubMembers(clubId);
      addToast('Lead appointed!', 'success');
    } catch (err: any) { addToast(`Failed: ${err.message}`, 'info'); }
  };

  const removeClubLead = async (clubId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) { addToast('Only admins can remove leads.', 'info'); return; }
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ role: 'member' })
        .eq('club_id', clubId)
        .eq('profile_id', profileId);
      if (error) throw error;
      await refreshClubMembers(clubId);
      addToast('Lead removed.', 'info');
    } catch (err: any) { addToast(`Failed: ${err.message}`, 'info'); }
  };

  // === EVENT HOST MANAGEMENT ===

  const refreshEventHosts = async (eventId: string) => {
    try {
      const { data: hostRows } = await supabase
        .from('event_hosts')
        .select('id, event_id, profile_id, role, joined_at')
        .eq('event_id', eventId);

      if (!hostRows) return;

      const profileIds = [...new Set(hostRows.map((h: any) => h.profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', profileIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const hosts: EventHost[] = hostRows.map((h: any) => {
        const profile = profileMap.get(h.profile_id);
        return {
          id: h.id,
          eventId: h.event_id,
          profileId: h.profile_id,
          role: h.role,
          joinedAt: h.joined_at,
          profile: profile ? {
            id: profile.id,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
          } : undefined,
        };
      });

      setEventHosts((prev) => ({ ...prev, [eventId]: hosts }));
    } catch (err) {
      console.error('Error refreshing event hosts:', err);
    }
  };

  const addEventLead = async (eventId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) { addToast('Only admins can appoint hosts.', 'info'); return; }
    try {
      const { data: existing } = await supabase
        .from('event_hosts')
        .select('id, role')
        .eq('event_id', eventId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        if (existing.role === 'lead') { addToast('Already a lead host.', 'info'); return; }
        const { error } = await supabase.from('event_hosts').update({ role: 'lead' }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('event_hosts').insert({ event_id: eventId, profile_id: profileId, role: 'lead' });
        if (error) throw error;
      }
      await refreshEventHosts(eventId);
      addToast('Host appointed!', 'success');
    } catch (err: any) { addToast(`Failed: ${err.message}`, 'info'); }
  };

  const removeEventLead = async (eventId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) { addToast('Only admins can remove hosts.', 'info'); return; }
    try {
      const { error } = await supabase
        .from('event_hosts')
        .update({ role: 'member' })
        .eq('event_id', eventId)
        .eq('profile_id', profileId);
      if (error) throw error;
      await refreshEventHosts(eventId);
      addToast('Host removed.', 'info');
    } catch (err: any) { addToast(`Failed: ${err.message}`, 'info'); }
  };

  // === PROJECT LEAD MANAGEMENT ===

  const refreshProjectMembers = async (projectId: string) => {
    try {
      const { data: memberRows } = await supabase
        .from('project_members')
        .select('id, project_id, profile_id, role, joined_at')
        .eq('project_id', projectId);

      if (!memberRows) return;

      const profileIds = [...new Set(memberRows.map((m: any) => m.profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', profileIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const members = memberRows.map((m: any) => {
        const profile = profileMap.get(m.profile_id);
        return {
          id: m.id,
          profileId: m.profile_id,
          fullName: profile?.full_name || 'Unknown',
          avatarUrl: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || '?')}&background=9E2A2B&color=fff&size=200`,
          role: m.role || 'member',
        };
      });

      setProjects((prev) => prev.map((p: any) =>
        p.id === projectId ? { ...p, membersList: members } : p
      ));
    } catch (err) {
      console.error('Error refreshing project members:', err);
    }
  };

  const addProjectLead = async (projectId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) { addToast('Only admins can appoint project leads.', 'info'); return; }
    try {
      const { data: existing } = await supabase
        .from('project_members')
        .select('id, role')
        .eq('project_id', projectId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        if (existing.role === 'lead') { addToast('Already a project lead.', 'info'); return; }
        const { error } = await supabase.from('project_members').update({ role: 'lead' }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_members').insert({ project_id: projectId, profile_id: profileId, role: 'lead' });
        if (error) throw error;
      }
      await refreshProjectMembers(projectId);
      addToast('Project lead appointed!', 'success');
    } catch (err: any) { addToast(`Failed: ${err.message}`, 'info'); }
  };

  const removeProjectLead = async (projectId: string, profileId: string) => {
    const permitted = await checkManagePermission();
    if (!permitted) { addToast('Only admins can remove project leads.', 'info'); return; }
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: 'member' })
        .eq('project_id', projectId)
        .eq('profile_id', profileId);
      if (error) throw error;
      await refreshProjectMembers(projectId);
      addToast('Project lead removed.', 'info');
    } catch (err: any) { addToast(`Failed: ${err.message}`, 'info'); }
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
      userJoinedProjects, setUserJoinedProjects,
      communities, setCommunities,
      communityPosts, setCommunityPosts,
      userCommunities, setUserCommunities,
      myLeadCommunities, setMyLeadCommunities,
      createCommunity, updateCommunity, deleteCommunity,
      joinCommunity, leaveCommunity,
      createCommunityPost, updateCommunityPost, deleteCommunityPost,
      addCommunityLead, removeCommunityLead, refreshCommunityMembers,
      clubMembers, eventHosts,
      addClubLead, removeClubLead, refreshClubMembers,
      addEventLead, removeEventLead, refreshEventHosts,
      addProjectLead, removeProjectLead, refreshProjectMembers,
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
