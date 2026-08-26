import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student Node Member');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setFullName(data.full_name || '');
          setEmail(data.contact?.email || user.email || '');
          setRole(data.role || 'Student Node Member');
          setAvatarUrl(data.avatar_url || '');
        } else {
          setEmail(user.email || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setEmail(user.email || '');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#9E2A2B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6 text-slate-800">
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Account Console</h1>
          <p className="text-xs text-slate-500 font-medium">Configure profile meta-data, target badges, and telemetry alerts.</p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || email || 'User') + '&background=9E2A2B&color=fff&size=200'}
              alt="Me"
              className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-950">{fullName || 'User'}</h3>
              <p className="text-xs text-slate-400 font-medium">{email}</p>
              <span className="inline-block px-2.5 py-0.5 bg-[#FDF2F2] text-[#9E2A2B] font-bold text-[10px] border border-rose-100 rounded-full uppercase tracking-wider mt-1">
                {role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={fullName}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Campus ID
              </label>
              <input
                type="text"
                defaultValue={user?.id?.slice(0, 8) || 'N/A'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Preferences</h4>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Email Notifications</span>
                <p className="text-[11px] text-slate-400 font-medium">Receive weekly network reports and event briefs.</p>
              </div>
              <label className="relative flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-[#9E2A2B]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Co-Lab Joining Alerts</span>
                <p className="text-[11px] text-slate-400 font-medium">Instant notifications when members request to join your project sprint.</p>
              </div>
              <label className="relative flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-[#9E2A2B]"></div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => addToast('Settings successfully updated!', 'success')}
              className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs shadow-xs transition-all cursor-pointer border border-transparent"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
