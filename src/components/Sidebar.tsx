import { Home, Users, Rocket, UserCheck, CalendarDays, MessageSquare, Briefcase, FileText, Settings, LogOut, Sparkles, User, FileSearch, ListOrdered } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  unreadCount?: number;
  userRole?: string;
}

export default function Sidebar({ activeView, onNavigate, unreadCount = 3, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'clubs', label: 'Clubs', icon: Users },
    { id: 'projects', label: 'Projects', icon: Rocket },
    { id: 'mentors', label: 'Mentors', icon: UserCheck },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'opportunities', label: 'Opportunities', icon: Sparkles, roles: ['alumni', 'admin'] },
    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
    { id: 'resume', label: 'Resume Analyzer', icon: FileSearch, roles: ['student'] },
    { id: 'jd-ranker', label: 'JD Ranker', icon: ListOrdered, roles: ['alumni', 'admin'] },
    { id: 'profile', label: 'My Profile', icon: User },
  ].filter(item => !item.roles || item.roles.includes(userRole || ''));

  const secondaryItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'signout', label: 'Sign Out', icon: LogOut },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-4">
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id || (item.id === 'home' && activeView === '');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold tracking-normal font-sans border border-transparent transition-all duration-150 focus:outline-none cursor-pointer ${
                isActive
                  ? 'bg-[#FDF2F2] text-[#9E2A2B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#9E2A2B]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-sans ${
                  isActive ? 'bg-[#9E2A2B] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100 space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'signout') {
                  handleSignOut();
                } else {
                  onNavigate(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold tracking-normal font-sans border border-transparent transition-all duration-150 focus:outline-none cursor-pointer ${
                isActive
                  ? 'bg-[#FDF2F2] text-[#9E2A2B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#9E2A2B]' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
