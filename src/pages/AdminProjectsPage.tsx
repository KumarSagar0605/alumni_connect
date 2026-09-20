// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Settings, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { PageSkeleton } from '../components/Skeleton';
import MemberManager from '../components/MemberManager';

export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const { projects, dataLoading, addProjectLead, removeProjectLead, refreshProjectMembers } = useApp();
  const [memberManagerProject, setMemberManagerProject] = useState<string | null>(null);

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
        <h1 className="text-2xl font-bold text-slate-900">Manage Projects</h1>
        <p className="text-sm text-slate-500 mt-0.5">Appoint leads and manage project memberships</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <Rocket className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => {
            const members = project.membersList || [];
            const leads = members.filter((m: any) => m.role === 'lead');
            return (
              <div key={project.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                <div className="relative h-24">
                  <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B]" />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      project.badge === 'Recruiting' ? 'bg-emerald-500 text-white' :
                      project.badge === 'Needs Mentor' ? 'bg-amber-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>{project.badge}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm">{project.name}</h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{project.description || 'No description'}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Rocket className="w-3.5 h-3.5" /> {members.length} member{members.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> {leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
                  </div>
                  {leads.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {leads.slice(0, 3).map((lead: any) => (
                        <div key={lead.profileId} className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white overflow-hidden -ml-1 first:ml-0" title={lead.fullName}>
                          <img src={lead.avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => navigate('/projects')} className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">View</button>
                    <button onClick={() => setMemberManagerProject(project.id)} className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1">
                      <Settings className="w-3 h-3" /> Leads
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {memberManagerProject && (
        <MemberManager
          isOpen={true}
          onClose={() => setMemberManagerProject(null)}
          entityName={projects.find((p: any) => p.id === memberManagerProject)?.name || ''}
          entityType="project"
          entityId={memberManagerProject}
          members={(projects.find((p: any) => p.id === memberManagerProject)?.membersList || []).map((m: any) => ({
            id: m.id || m.profileId,
            profileId: m.profileId,
            role: m.role || 'member',
            profile: { id: m.profileId, fullName: m.fullName, avatarUrl: m.avatarUrl, role: 'student' },
          }))}
          onAddLead={addProjectLead}
          onRemoveLead={removeProjectLead}
        />
      )}
    </div>
  );
}
