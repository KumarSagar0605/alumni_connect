import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onAddToast: (message: string, type: 'success' | 'info') => void;
}

export default function Login({ onLoginSuccess, onAddToast }: LoginProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'alumni' | 'admin'>('student');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: role },
          },
        });
        if (error) throw error;
        onAddToast('Account created! You can now log in.', 'success');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAddToast('Welcome back to Atria Communities!', 'success');
        onLoginSuccess();
        navigate('/');
      }
    } catch (error: any) {
      onAddToast(error.message, 'info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#FDF2F2] text-[#9E2A2B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSignUp ? 'Join the Collective' : 'Welcome Back'}
          </h2>
          <p className="text-sm font-medium text-slate-500">
            {isSignUp ? 'Create your Atria network account.' : 'Sign in to sync with your communities.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#9E2A2B]" placeholder="e.g. Priya Rao" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#9E2A2B] cursor-pointer">
                  <option value="student">Student</option>
                  <option value="alumni">Alumni / Mentor</option>
                  <option value="admin">Administrator (Demo)</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#9E2A2B]" placeholder="you@atria.edu" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#9E2A2B]" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 mt-2">
            {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-slate-500 hover:text-[#9E2A2B] transition-colors">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}