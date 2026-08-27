import { useState } from 'react';
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
  X,
  Check,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectDetailProps {
  project: Project;
  currentUser: any;
  onBack: () => void;
  onToggleJoin: (id: string) => void;
  onToggleMentor: (id: string) => void;
  onNavigateToClub: (clubName: string) => void;
  onNavigateToMessages: () => void;
  onSaveProject: (updates: Partial<Project>) => Promise<void>;
  onAddToast: (message: string, type?: 'success' | 'info') => void;
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
  onBack,
  onToggleJoin,
  onToggleMentor,
  onNavigateToClub,
  onNavigateToMessages,
  onSaveProject,
  onAddToast,
}: ProjectDetailProps) {
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

  const toggleMilestone = (index: number) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, done: !m.done } : m))
    );
    onAddToast('Milestone updated!', 'success');
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
        {isCreator && (
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
              <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                <Pencil className="w-3.5 h-3.5" /> Edit Project
              </button>
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
              <button onClick={() => onToggleJoin(project.id)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${project.joined ? 'bg-white/10 border-white/20 text-white' : 'bg-white text-[#9E2A2B] border-transparent hover:bg-slate-50 shadow-xs'}`}>
                {project.joined ? '✓ Joined' : 'Join Project'}
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Team Roster</h3>
              <span className="text-[10px] font-bold text-slate-400">{project.members.length} members</span>
            </div>
            <div className="flex -space-x-2">
              {memberAvatars.slice(0, 4).map((av, i) => (
                <img key={i} src={av} alt="member" className="w-9 h-9 rounded-full border-2 border-white object-cover" referrerPolicy="no-referrer" />
              ))}
              {project.members.length > 4 && (
                <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">+{project.members.length - 4}</div>
              )}
            </div>
          </div>

          {project.needsMentor && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap className="w-4 h-4 text-[#9E2A2B]" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Advisor Sync</h3>
              </div>
              {project.mentored ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700">Advisor Connected</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Dr. Elena Vance is aligned with your project</p>
                    </div>
                  </div>
                  <button onClick={onNavigateToMessages} className="w-full py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <MessageCircle className="w-4 h-4" /> Message Advisor
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 font-medium">This project is looking for an experienced advisor. Offer your guidance or connect them with a mentor.</p>
                  <button onClick={() => onToggleMentor(project.id)} className="w-full py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> Offer Advice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
