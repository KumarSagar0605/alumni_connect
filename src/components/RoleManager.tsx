import { useState } from 'react';
import { ShieldCheck, Search, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';

interface FoundProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
}

/**
 * Superadmin-only helper to appoint `head` accounts.
 * Rendered inside MyProfile; hard-gated so only `role === 'admin'` sees it.
 * The database RLS policy on `profiles` is the authoritative enforcement —
 * non-admin UPDATE attempts are rejected server-side.
 */
export default function RoleManager() {
  const { userRole } = useAuth();
  const { addToast } = useApp();
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<FoundProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  if (userRole !== 'admin') return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = email.trim().toLowerCase();
    if (!query) return;
    setSearching(true);
    setFound(null);
    try {
      // Profiles store contact email in contact->email; fall back to full_name match.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, role')
        .or(`contact->>email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        addToast('No member found for that email or name.', 'info');
        return;
      }
      setFound(data as FoundProfile);
    } catch (err: any) {
      addToast(err?.message || 'Member lookup failed.', 'info');
    } finally {
      setSearching(false);
    }
  };

  const setRole = async (nextRole: 'head' | 'student' | 'alumni') => {
    if (!found) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', found.id);
      if (error) throw error;
      setFound({ ...found, role: nextRole });
      addToast(
        nextRole === 'head'
          ? `${found.full_name} appointed as head.`
          : `${found.full_name} moved to ${nextRole}.`,
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Role update failed. RLS may have blocked it.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#9E2A2B]" />
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">
          Role Management · Admin only
        </h4>
      </div>
      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
        Promote a trusted member to <span className="font-bold text-slate-700">head</span> so they can
        create and manage clubs, projects, and events. Demote back to student/alumni any time.
      </p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-3 py-2 bg-[#9E2A2B] hover:bg-[#802223] text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          {searching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Find
        </button>
      </form>
      {found && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{found.full_name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                current role: <span className="text-[#9E2A2B]">{found.role}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRole('head')}
              disabled={saving || found.role === 'head'}
              className="px-3 py-1.5 bg-[#9E2A2B] hover:bg-[#802223] text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              Appoint head
            </button>
            <button
              onClick={() => setRole('student')}
              disabled={saving || found.role === 'student'}
              className="px-3 py-1.5 border border-slate-200 hover:bg-white text-slate-600 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              Demote to student
            </button>
            <button
              onClick={() => setRole('alumni')}
              disabled={saving || found.role === 'alumni'}
              className="px-3 py-1.5 border border-slate-200 hover:bg-white text-slate-600 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              Demote to alumni
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
