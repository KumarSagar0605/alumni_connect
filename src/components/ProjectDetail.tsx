import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Users,
  Share2,
  Rocket,
  GraduationCap,
  MessageCircle,
  CheckCircle2,
  Circle,
  Code,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Project, ProjectMentor } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ProjectDetailProps {
  project: Project;
  currentUser: any;
  userRole?: string | null;
  isMentor?: boolean;
  onBack: () => void;
  onToggleJoin: (id: string) => void;
  onToggleMentor: (id: string) => void;
  onNavigateToClub: (clubName: string) => void;
  onNavigateToMessages: () => void;
  onMessageMentor: (mentorProfileId: string, projectId: string) => void;
  onSaveProject: (updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddToast: (message: string, type?: 'success' | 'info') => void;
  userJoinedProjects?: Set<string> | undefined;
}

const defaultMilestones = [
  { name: 'Phase 1: Architecture & Planning', done: true },
  { name: 'Phase 2: MVP Development', done: false },
  { name: 'Phase 3: Testing & QA', done: false },
  { name: 'Phase 4: Deployment & Launch', done: false },
];

const defaultTechStack = ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];

const memberAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
];

export default function ProjectDetail({
  project,
  currentUser,
  userRole,
  isMentor,
  onBack,
  onToggleJoin,
  onToggleMentor,
  onNavigateToClub,
  onNavigateToMessages,
  onMessageMentor,
  onSaveProject,
  onDeleteProject,
  onAddToast,
  userJoinedProjects,
}: ProjectDetailProps) {
  const { canManage } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const isCreator = currentUser && project.created_by && currentUser.id === project.created_by;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description);
  const [editBadge, setEditBadge] = useState(project.badge);
  const [editCategory, setEditCategory] = useState(project.category);
  const [editProgress, setEditProgress] = useState(project.progress);

  const [milestones, setMilestones] = useState(
    project.milestones && project.milestones.length > 0 ? project.milestones : defaultMilestones
  );

  // Re-sync local milestone/progress editors when navigating between projects
  // (the component instance is reused across selections).
  useEffect(() => {
    setMilestones(
      project.milestones && project.milestones.length > 0 ? project.milestones : defaultMilestones
    );
    setEditProgress(project.progress);
    setEditName(project.name);
    setEditDescription(project.description);
    setEditBadge(project.badge);
    setEditCategory(project.category);
    setIsEditing(false);
  }, [project.id]);

  const toggleMilestone = async (index: number) => {
    const next = milestones.map((m, i) => (i === index ? { ...m, done: !m.done } : m));
    setMilestones(next);
    // Milestone state lives in the projects row: persist for managers
    // (RLS blocks students anyway); students get a local preview only.
    // onSaveProject surfaces its own success/failure toasts.
    if (canManage) {
      await onSaveProject({ milestones: next } as any);
    } else {
      onAddToast('Milestone updated!', 'success');
    }
  };

  const handleSave = async () => {
    await onSaveProject({
      name: editName,
      description: editDescription,
      badge: editBadge,
      category: editCategory,
      progress: editProgress,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDeleteProject(project.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditName(project.name);
    setEditDescription(project.description);
    setEditBadge(project.badge);
    setEditCategory(project.category);
    setEditProgress(project.progress);
    setIsEditing(false);
  };

  const techStack = project.techStack && project.techStack.length > 0 ? project.techStack : defaultTechStack;
  const completedCount = milestones.filter((m) => m.done).length;

  // Real roster from project_members + profiles; falls back to the legacy
  // static avatar list for projects created before membership tracking.
  const studentRoster =
    project.membersList && project.membersList.length > 0
      ? project.membersList.map((m) => ({ key: m.profileId, name: m.fullName, avatar: m.avatarUrl }))
      : (project.members || []).map((avatar, i) => ({ key: `legacy-${i}`, name: `Student ${i + 1}`, avatar }));

  const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold text-slate-800 placeholder-slate-400";
  const textareaCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold text-slate-800 placeholder-slate-400 resize-none";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans">
            <span className="hover:text-slate-600 cursor-pointer" onClick={onBack}>Co-Lab Teams</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[#9E2A2B] font-bold">{project.name}</span>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button onClick={handleSave} className="px-3 py-1.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit Project
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#9E2A2B] to-[#C0392B] px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-xl font-extrabold focus:outline-none focus:bg-white/20" placeholder="Project name" />
                  <div className="flex gap-3">
                    <select value={editBadge} onChange={(e) => setEditBadge(e.target.value as Project['badge'])} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-bold focus:outline-none cursor-pointer">
                      <option value="Recruiting" className="text-slate-800">Recruiting</option>
                      <option value="Needs Mentor" className="text-slate-800">Needs Mentor</option>
                      <option value="In Progress" className="text-slate-800">In Progress</option>
                    </select>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-bold focus:outline-none cursor-pointer">
                      <option value="Technology" className="text-slate-800">Technology</option>
                      <option value="Arts" className="text-slate-800">Arts</option>
                      <option value="Environment" className="text-slate-800">Environment</option>
                      <option value="Business" className="text-slate-800">Business</option>
                      <option value="Social" className="text-slate-800">Social</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      project.badge === 'Recruiting' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100' : project.badge === 'Needs Mentor' ? 'bg-amber-500/20 border-amber-400/30 text-amber-100' : 'bg-white/20 border-white/20 text-white'
                    }`}>{project.badge}</span>
                    <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">{project.category}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{project.name}</h1>
                  <div className="flex items-center gap-2 text-xs text-rose-200 font-semibold">
                    <Rocket className="w-4 h-4" />
                    <span className="hover:text-white cursor-pointer underline underline-offset-2" onClick={() => onNavigateToClub(project.clubName)}>{project.clubName}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); onAddToast('Project link copied!', 'success'); }} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              {project.needsMentor && (
                <button onClick={() => onToggleMentor(project.id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${project.mentored ? 'bg-white text-[#9E2A2B] border-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/10'}`}>
                  {project.mentored ? '✓ Advisor Synced' : 'Offer Advice'}
                </button>
              )}
              <button onClick={() => onToggleJoin(project.id)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${userJoinedProjects?.has(project.id) ? 'bg-white/10 border-white/20 text-white' : 'bg-white text-[#9E2A2B] border-transparent hover:bg-slate-50 shadow-xs'}`}>
                {userJoinedProjects?.has(project.id) ? '✓ Joined' : 'Join Project'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">Sprint Progress</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="100" value={editProgress} onChange={(e) => setEditProgress(Number(e.target.value))} className="w-24 h-1 accent-[#9E2A2B] cursor-pointer" />
                <span className="text-xs font-black text-[#9E2A2B]">{editProgress}%</span>
              </div>
            ) : (
              <span className="text-xs font-black text-[#9E2A2B]">{project.progress}%</span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div style={{ width: `${isEditing ? editProgress : project.progress}%` }} className="h-full rounded-full bg-gradient-to-r from-[#9E2A2B] to-[#C0392B] transition-all duration-700" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Overview</h2>
            {isEditing ? (
              <textarea rows={4} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={textareaCls} placeholder="Project description" />
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{project.description}</p>
            )}
            {project.lead && (
              <p className="text-[11px] font-bold text-slate-500">
                Project lead: <span className="text-slate-800">{project.lead}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {techStack.map((tech, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">
                  <Code className="w-3 h-3 text-slate-400" />{tech}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Sprint Milestones</h2>
              <span className="text-[10px] font-bold text-slate-400">{completedCount}/{milestones.length} Complete</span>
            </div>
            <div className="space-y-3">
              {milestones.map((milestone, i) => (
                <button key={i} onClick={() => toggleMilestone(i)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#9E2A2B]/20 hover:bg-[#FDF2F2]/30 transition-all text-left group cursor-pointer">
                  {milestone.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 group-hover:text-[#9E2A2B] shrink-0" />}
                  <span className={`text-xs font-semibold ${milestone.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{milestone.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Team Roster - Students */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Students
              </h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">{studentRoster.length}</span>
            </div>
            <div className="space-y-2">
              {studentRoster.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-medium text-center py-2">No students have joined yet. Be the first!</p>
              ) : (
                studentRoster.slice(0, 6).map((member) => (
                  <div key={member.key} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                    <span className="text-[11px] font-semibold text-slate-600 truncate">{member.name}</span>
                  </div>
                ))
              )}
              {studentRoster.length > 6 && (
                <p className="text-[10px] text-slate-400 font-bold text-center">+{studentRoster.length - 6} more</p>
              )}
            </div>
          </div>

          {/* Mentors List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#9E2A2B]" />
                Mentors
              </h3>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                {(project.mentorsList || []).length}
              </span>
            </div>

            {(project.mentorsList || []).length === 0 ? (
              <div className="text-center py-3">
                <p className="text-[11px] text-slate-400 font-medium">No mentors yet</p>
                {userRole === 'alumni' && !isMentor && (
                  <button
                    onClick={() => onToggleMentor(project.id)}
                    className="mt-2 text-[11px] text-[#9E2A2B] font-bold hover:underline cursor-pointer"
                  >
                    Be the first mentor
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(project.mentorsList || []).map((mentor) => (
                  <div key={mentor.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="relative shrink-0">
                      <img
                        src={mentor.avatarUrl}
                        alt={mentor.fullName}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{mentor.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Mentor</p>
                    </div>
                    {/* Students can message this mentor */}
                    {userRole === 'student' && (
                      <button
                        onClick={() => onMessageMentor(mentor.profileId, project.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FDF2F2] hover:bg-[#9E2A2B] text-[#9E2A2B] hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">Message</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Alumni: Join/Leave mentor button */}
            {userRole === 'alumni' && (
              <div className="pt-2 border-t border-slate-100">
                {isMentor ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-100 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700">You're mentoring this project</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onToggleMentor(project.id)}
                        className="flex-1 py-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-amber-700 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Leave
                      </button>
                      <button
                        onClick={onNavigateToMessages}
                        className="flex-1 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> Messages
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onToggleMentor(project.id)}
                    className="w-full py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5" /> Join as Mentor
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
