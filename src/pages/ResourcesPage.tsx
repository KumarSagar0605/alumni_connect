import {
  Calendar,
  FileText,
  Palette,
  Users,
  Cpu,
  ExternalLink,
  Download,
  Link,
  Key,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const iconMap: Record<string, React.ComponentType<any>> = {
  Calendar, FileText, Palette, Users, Cpu, ExternalLink, Download, Link, Key,
};

export default function ResourcesPage() {
  const { resources, addToast } = useApp();

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Collective Assets & Toolkits</h1>
          <p className="text-xs text-slate-500 font-medium">
            Access guidelines, reservation portals, brand assets, and campus software packages curated by Atria clubs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {resources.map((resource) => {
            const Icon = iconMap[resource.icon] || FileText;
            return (
              <div
                key={resource.id}
                className="bg-white border border-slate-150 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Icon className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {resource.meta}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (resource.action_type === 'download') {
                      addToast(`Started downloading: ${resource.title}`, 'success');
                    } else if (resource.action_type === 'request') {
                      addToast(`Access request submitted for: ${resource.title}`, 'success');
                    } else if (resource.action_type === 'claim') {
                      addToast('License key copied to clipboard!', 'success');
                    } else {
                      addToast(`Redirecting to reservation portal...`, 'info');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border border-slate-200 hover:bg-[#FDF2F2] hover:border-rose-100 hover:text-[#9E2A2B] text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {resource.action_type === 'download' && <Download className="w-4 h-4" />}
                  {resource.action_type === 'link' && <ExternalLink className="w-4 h-4" />}
                  <span>{resource.action_label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
