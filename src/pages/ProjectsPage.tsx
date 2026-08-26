import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Project } from '../types';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { PageSkeleton } from '../components/Skeleton';
import ProjectDetail from '../components/ProjectDetail';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects,
    setProjects,
    clubs,
    searchQuery,
    setSearchQuery,
    addToast,
    setIsCreateOpen,
    dataLoading,
  } = useApp();

  const [projectFilter, setProjectFilter] = useState<'All' | 'Recruiting' | 'Needs Mentor' | 'Joined'>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (projectFilter === 'Recruiting') matchesFilter = proj.badge === 'Recruiting';
    else if (projectFilter === 'Needs Mentor') matchesFilter = proj.badge === 'Needs Mentor';
    else if (projectFilter === 'Joined') matchesFilter = proj.joined;

    return matchesSearch && matchesFilter;
  });

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
          onBack={() => setSelectedProjectId(null)}
          onToggleJoin={toggleJoinProject}
          onToggleMentor={toggleMentorProject}
          onNavigateToClub={(clubName) => {
            const matchedClub = clubs.find((c) => c.name.toLowerCase().includes(clubName.toLowerCase()) || clubName.toLowerCase().includes(c.name.toLowerCase()));
            if (matchedClub) navigate('/clubs');
            else addToast(`Opened details for ${clubName}`, 'info');
          }}
          onNavigateToMessages={() => navigate('/messages')}
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Co-Lab Teams</h1>
            <p className="text-xs text-slate-500 font-medium">Join committed sprint groups or offer senior research advice.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Launch Project
          </button>
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
          {filteredProjects.map((project) => (
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
                      onClick={(e) => { e.stopPropagation(); toggleMentorProject(project.id); }}
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
    </div>
  );
}
