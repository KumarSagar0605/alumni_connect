// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, GraduationCap } from 'lucide-react';
import { Project } from '../types';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/Skeleton';
import ProjectDetail from '../components/ProjectDetail';
import { joinAsMentor, leaveMentorRole, getMyMentorProjects, getOrCreateConversation, getProfileId, getMemberProfile } from '../services/messagingService';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user, userRole, canManage } = useAuth();
  const {
    projects,
    setProjects,
    clubs,
    searchQuery,
    setSearchQuery,
    addToast,
    setIsCreateOpen,
    dataLoading,
    userJoinedProjects,
    setUserJoinedProjects,
  } = useApp();

  const [projectFilter, setProjectFilter] = useState<'All' | 'Recruiting' | 'Needs Mentor' | 'Joined'>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [myMentorProjects, setMyMentorProjects] = useState<string[]>([]);
  const [mentoringLoading, setMentoringLoading] = useState<Record<string, boolean>>({});
  // In-flight join/leave guard: rapid double-clicks must not fire two
  // inserts (the second one 409s on the unique constraint).
  const joiningRef = useRef<Set<string>>(new Set());

  // Load mentor project IDs for alumni
  useEffect(() => {
    if (user?.id && userRole === 'alumni') {
      getMyMentorProjects(user.id).then(setMyMentorProjects);
    }
  }, [user?.id, userRole]);

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (projectFilter === 'Recruiting') matchesFilter = proj.badge === 'Recruiting';
    else if (projectFilter === 'Needs Mentor') matchesFilter = proj.badge === 'Needs Mentor';
    else if (projectFilter === 'Joined') matchesFilter = userJoinedProjects.has(proj.id);

    return matchesSearch && matchesFilter;
  });

  const toggleJoinProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target || !user?.id) return;
    // Drop duplicate in-flight toggles for the same project (double-click).
    if (joiningRef.current.has(projectId)) return;
    joiningRef.current.add(projectId);

    const alreadyJoined = userJoinedProjects?.has(projectId) ?? false;

    try {
      // project_members.profile_id references profiles.id (not the auth uid)
      const profileId = await getProfileId(user.id);
      if (!profileId) {
        addToast('Could not find your member profile. Please complete your profile first.', 'info');
        return;
      }

      if (alreadyJoined) {
        // Leave the project
        const { error } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)
          .eq('profile_id', profileId);

        if (error) throw error;

        setUserJoinedProjects((prev) => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        setProjects((prev: Project[]) =>
          prev.map((p: Project) => (p.id === projectId
            ? { ...p, membersList: (p.membersList || []).filter((m) => m.profileId !== profileId) }
            : p))
        );
      } else {
        // Join the project
        const { error } = await supabase
          .from('project_members')
          .insert({ project_id: projectId, profile_id: profileId });

        if (error) {
          // 23505 = unique violation: the membership row already exists
          // (stale local state or a racing second click). Sync to joined
          // instead of erroring.
          if ((error as any)?.code === '23505') {
            setUserJoinedProjects((prev) => new Set(prev).add(projectId));
            const me = await getMemberProfile(user.id);
            if (me) {
              setProjects((prev: Project[]) =>
                prev.map((p: Project) => {
                  if (p.id !== projectId) return p;
                  const list = p.membersList || [];
                  return list.some((m) => m.profileId === me.profileId)
                    ? p
                    : { ...p, membersList: [...list, me] };
                })
              );
            }
            addToast(`You joined "${target.name}". Welcome to the project team!`, 'success');
            return;
          }
          throw error;
        }

        setUserJoinedProjects((prev) => {
          const newSet = new Set(prev);
          newSet.add(projectId);
          return newSet;
        });
        const me = await getMemberProfile(user.id);
        if (me) {
          setProjects((prev: Project[]) =>
            prev.map((p: Project) => (p.id === projectId
              ? { ...p, membersList: [...(p.membersList || []), me] }
              : p))
          );
        }
      }

      addToast(alreadyJoined ? `You left "${target.name}".` : `You joined "${target.name}". Welcome to the project team!`, alreadyJoined ? 'info' : 'success');
    } catch (err) {
      console.error('Error toggling project join:', err);
      addToast('Failed to toggle project join status', 'info');
    } finally {
      joiningRef.current.delete(projectId);
    }
  };

  const handleMentorToggle = async (projectId: string) => {
    if (!user?.id) return;
    const isCurrentlyMentor = myMentorProjects.includes(projectId);

    setMentoringLoading((prev) => ({ ...prev, [projectId]: true }));

    try {
      if (isCurrentlyMentor) {
        const success = await leaveMentorRole(user.id, projectId);
        if (success) {
          setMyMentorProjects((prev) => prev.filter((id) => id !== projectId));
          const target = projects.find((p) => p.id === projectId);
          addToast(`You left the mentor role for "${target?.name}".`, 'info');
        } else {
          addToast('Failed to leave mentor role.', 'info');
        }
      } else {
        const success = await joinAsMentor(user.id, projectId);
        if (success) {
          setMyMentorProjects((prev) => [...prev, projectId]);
          const target = projects.find((p) => p.id === projectId);
          addToast(`You are now a mentor for "${target?.name}"! Students can now message you.`, 'success');
        } else {
          addToast('Failed to join as mentor.', 'info');
        }
      }
    } finally {
      setMentoringLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handleMessageMentor = async (mentorProfileId: string, projectId: string) => {
    if (!user?.id) return;
    const conv = await getOrCreateConversation(user.id, mentorProfileId, projectId);
    if (conv) {
      navigate('/messages');
      addToast('Conversation opened. Send your first message!', 'success');
    } else {
      addToast('Could not start conversation. You may not have permission.', 'info');
    }
  };

  if (selectedProjectId) {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) {
      setSelectedProjectId(null);
      return null;
    }
    return (
      <div className="space-y-8 pb-12 font-sans text-slate-800">
        <ProjectDetail
          project={project}
          currentUser={user}
          userRole={userRole}
          isMentor={myMentorProjects.includes(project.id)}
          onBack={() => setSelectedProjectId(null)}
          onToggleJoin={toggleJoinProject}
          onToggleMentor={() => handleMentorToggle(project.id)}
          onNavigateToClub={(clubName) => {
            const matchedClub = clubs.find((c) => c.name.toLowerCase().includes(clubName.toLowerCase()) || clubName.toLowerCase().includes(c.name.toLowerCase()));
            if (matchedClub) navigate('/clubs');
            else addToast(`Opened details for ${clubName}`, 'info');
          }}
          onNavigateToMessages={() => navigate('/messages')}
          onMessageMentor={handleMessageMentor}
          onSaveProject={async (updates) => {
            try {
              // Translate frontend camelCase fields to DB snake_case columns
              // (milestones/lead share names; techStack -> tech_stack).
              const dbUpdates: Record<string, any> = { ...updates };
              if (updates.techStack !== undefined) {
                dbUpdates.tech_stack = updates.techStack;
                delete dbUpdates.techStack;
              }
              const { error } = await supabase.from('projects').update(dbUpdates).eq('id', project.id);
              if (error) throw error;
              setProjects((prev: Project[]) =>
                prev.map((p) => (p.id === project.id ? { ...p, ...updates } : p))
              );
              addToast('Project updated successfully!', 'success');
            } catch (err: any) {
              addToast(`Failed to update project: ${err.message}`, 'info');
            }
          }}
          onAddToast={addToast}
          userJoinedProjects={userJoinedProjects}
          onDeleteProject={async (projectId) => {
            try {
              const target = projects.find((p) => p.id === projectId);
              const { error } = await supabase.from('projects').delete().eq('id', projectId);
              if (error) throw error;
              setProjects((prev: Project[]) => prev.filter((p) => p.id !== projectId));
              setSelectedProjectId(null);
              addToast(`Deleted "${target?.name || 'project'}".`, 'info');
            } catch (err: any) {
              addToast(`Failed to delete project: ${err.message}`, 'info');
            }
          }}
        />
      </div>
    );
  }

  if (dataLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Co-Lab Teams</h1>
            <p className="text-xs text-slate-500 font-medium">Join committed sprint groups or offer senior research advice.</p>
          </div>
          {canManage && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Launch Project
            </button>
          )}
        </div>

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

        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const isMentor = myMentorProjects.includes(project.id);
            const isLoading = mentoringLoading[project.id];

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs group flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-[#9E2A2B]/10 transition-all"
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
                    {isMentor && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-700 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        You're mentoring
                      </span>
                    )}
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
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {((project.membersList && project.membersList.length > 0
                          ? project.membersList.map((m) => m.avatarUrl)
                          : project.members
                        ).slice(0, 3)).map((avatar, idx) => (
                          <img
                            key={idx}
                            src={avatar}
                            alt="member"
                            className="w-7 h-7 rounded-full border-2 border-white object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                        {((project.membersList && project.membersList.length > 0
                          ? project.membersList.length
                          : project.members.length) > 3) && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                            +{(project.membersList && project.membersList.length > 0
                              ? project.membersList.length
                              : project.members.length) - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wide">
                        {project.membersList && project.membersList.length > 0
                          ? project.membersList.length
                          : project.members.length} students
                      </span>
                    </div>
                    {(project.mentorsList || []).length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full">
                        <GraduationCap className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] text-amber-700 font-bold">
                          {(project.mentorsList || []).length} mentor{(project.mentorsList || []).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Alumni: Join as Mentor button */}
                    {userRole === 'alumni' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMentorToggle(project.id);
                        }}
                        disabled={isLoading}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold transition-all border rounded-xl cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                          isMentor
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'border-amber-200 bg-white hover:bg-amber-50 text-amber-700'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {isLoading ? '...' : isMentor ? '✓ Mentoring' : 'Join as Mentor'}
                      </button>
                    )}

                    {/* Students: Offer Advice button (existing) */}
                    {userRole !== 'alumni' && project.needsMentor && (
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
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
                      onClick={(e) => { e.stopPropagation(); toggleJoinProject(project.id); }}
                      className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold transition-all border rounded-xl cursor-pointer ${
                        userJoinedProjects?.has(project.id)
                          ? 'bg-slate-100 border-slate-200 text-slate-600 shadow-xs'
                          : 'bg-[#9E2A2B] border-transparent hover:bg-[#802223] text-white shadow-xs'
                      }`}
                    >
                      {userJoinedProjects?.has(project.id) ? '✓ Joined Project' : 'Join Project'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
