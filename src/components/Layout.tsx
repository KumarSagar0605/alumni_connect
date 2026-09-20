import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Plus, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';
import Sidebar from './Sidebar';
import CreateModal from './CreateModal';
import Toast from './Toast';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';

export default function Layout() {
  const {
    clubs, searchQuery, setSearchQuery,
    toasts, removeToast,
    isCreateOpen, setIsCreateOpen,
    handleCreateSubmit, addToast,
    notifications, setNotifications,
  } = useApp();

  const { userRole, user, canManage } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (!user?.id) return;

    const fetchUnread = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      let convQuery;
      if (profile.role === 'student') {
        convQuery = supabase.from('conversations').select('id').eq('student_id', profile.id);
      } else if (profile.role === 'alumni') {
        convQuery = supabase.from('conversations').select('id').eq('mentor_profile_id', profile.id);
      } else {
        return;
      }

      const { data: convs } = await convQuery;
      if (!convs || convs.length === 0) return;

      const convIds = convs.map((c) => c.id);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', profile.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    // Poll every 10 seconds
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const location = useLocation();
  const navigate = useNavigate();
  const activeView = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleNav = (view: string) => {
    if (view === 'feed') navigate('/');
    else if (view.startsWith('admin-')) navigate(`/${view.replace('admin-', 'admin/')}`);
    else if (view === 'divider-admin') return;
    else navigate(`/${view}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-[#FDF2F2] selection:text-[#9E2A2B]">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 focus:outline-none border border-slate-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { handleNav('feed'); setSearchQuery(''); }}>
              <div className="w-8 h-8 rounded-lg bg-[#9E2A2B] flex items-center justify-center shadow-sm shrink-0">
                <div className="w-3.5 h-3.5 border-2 border-white rotate-45 transform" />
              </div>
              <h1 className="text-slate-900 font-extrabold text-base sm:text-lg font-sans tracking-tight shrink-0 uppercase">
                <span className="text-[#9E2A2B] font-black mr-1">CIA:</span>
                <span className="text-slate-800 font-bold">Communities in Atria</span>
              </h1>
            </div>
          </div>

          <div className="hidden md:block flex-1 max-w-lg mx-6 relative">
            <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, clubs, or mentors..."
              className="w-full pl-11 pr-14 py-2 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 transition-all text-sm text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-[10px] bg-white hover:bg-slate-50 text-slate-500 font-sans font-semibold px-2 py-0.5 rounded-full border border-slate-200"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none relative bg-transparent"
              >
                <Bell className="w-5 h-5" />
                {notifications.some((n) => !n.is_read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#9E2A2B] rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 font-sans">Alerts & News</span>
                        <button
                          onClick={() => {
                            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                            addToast('Marked all as read', 'info');
                          }}
                          className="text-[11px] text-[#9E2A2B] font-bold hover:underline font-sans"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 text-xs flex items-start gap-2.5 transition-colors ${
                              !notif.is_read ? 'bg-[#9E2A2B]/5' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${!notif.is_read ? 'text-[#9E2A2B]' : 'text-slate-400'}`} />
                            <div className="space-y-1 flex-1">
                              <p className={`text-slate-700 text-xs ${!notif.is_read ? 'font-semibold' : 'font-normal'}`}>{notif.text}</p>
                              <span className="text-[10px] text-slate-400 font-medium">{notif.time_text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {canManage && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 transition-all focus:outline-none shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            )}

            <button
              onClick={() => navigate('/profile')}
              className="relative shrink-0 focus:outline-none select-none rounded-full border border-slate-200 hover:border-[#9E2A2B] transition-colors"
              title={displayName}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=9E2A2B&color=fff&size=200`}
                alt="My Profile"
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN CONTAINER & 3-COLUMN LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:grid md:grid-cols-12 gap-8 relative">
        
        {/* Mobile Side Drawer Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="fixed top-0 bottom-0 left-0 w-64 bg-white z-50 md:hidden shadow-xl flex flex-col pt-16 px-4 border-r border-slate-200"
              >
                <div className="space-y-1.5 flex-1 pt-4 overflow-y-auto">
          <Sidebar activeView={activeView} onNavigate={handleNav} userRole={userRole} unreadCount={unreadCount} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Column 1: Sidebar Navigation (Desktop) */}
        <div className="hidden md:flex md:flex-col md:col-span-3 h-fit sticky top-24 gap-6">
          <Sidebar activeView={activeView} onNavigate={handleNav} userRole={userRole} />
        </div>

        {/* Column 2: Center Main scrollable Feed */}
        <div className={`col-span-1 flex-1 min-w-0 ${activeView === 'home' || activeView === '' ? 'md:col-span-6' : 'md:col-span-9'}`}>
          <Outlet />
        </div>

        {/* Column 3: Right Sidebar - only on home */}
        {(activeView === 'home' || activeView === '') && (
          <div className="col-span-1 md:col-span-3 h-fit space-y-6">
            {/* RightSidebar content is now inline in HomePage */}
          </div>
        )}

      </main>

      {/* 3. PLATFORM FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200/80 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-semibold text-slate-400 font-sans uppercase tracking-wider">
          <span>&copy; 2026 CIA: Communities in Atria. All rights reserved.</span>
          <div className="flex items-center gap-6 lowercase">
            <a href="#" className="hover:text-[#9E2A2B] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#9E2A2B] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#9E2A2B] transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* 4. MODALS & GLOBAL EMITTERS */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        clubs={clubs}
      />
      <Toast toasts={toasts} removeToast={removeToast} />

    </div>
  );
}
