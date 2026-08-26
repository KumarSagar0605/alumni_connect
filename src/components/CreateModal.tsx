import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Sparkles, Building2, Rocket, Calendar } from 'lucide-react';
import { Club, Project, Event } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'club' | 'project' | 'event', data: any) => void;
  clubs: Club[];
}

export default function CreateModal({ isOpen, onClose, onSubmit, clubs }: CreateModalProps) {
  const [activeTab, setActiveTab] = useState<'club' | 'project' | 'event'>('club');

  // Form states
  const [clubForm, setClubForm] = useState({
    name: '',
    category: 'Technology' as Club['category'],
    description: '',
    image: '',
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    category: 'Technology' as Project['category'],
    clubName: '',
    description: '',
    badge: 'Recruiting' as Project['badge'],
    needsMentor: false,
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    category: 'Technology' as Event['category'],
    description: '',
    date: '',
    image: '',
  });

  const handleClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubForm.name || !clubForm.description) return;
    const defaultImages: Record<Club['category'], string> = {
      Technology: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
      Environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
      Arts: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800',
      Business: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
      Social: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800',
    };
    onSubmit('club', {
      ...clubForm,
      image: clubForm.image || defaultImages[clubForm.category],
      membersCount: 1,
      joined: true,
      tag: clubForm.category.substring(0, 4),
    });
    // Reset
    setClubForm({ name: '', category: 'Technology', description: '', image: '' });
    onClose();
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.description) return;
    onSubmit('project', {
      ...projectForm,
      clubName: projectForm.clubName || 'Atria Innovation Lab',
      progress: 0,
      mentored: false,
      joined: true,
      members: ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'],
    });
    // Reset
    setProjectForm({ name: '', category: 'Technology', clubName: '', description: '', badge: 'Recruiting', needsMentor: false });
    onClose();
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name || !eventForm.description || !eventForm.date) return;
    const defaultImages: Record<string, string> = {
      Technology: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
      Environment: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800',
      Arts: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
      Business: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
      Social: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    };
    onSubmit('event', {
      ...eventForm,
      image: eventForm.image || defaultImages[eventForm.category],
      badge: 'Upcoming Event',
      registeredCount: 1,
      registered: true,
    });
    // Reset
    setEventForm({ name: '', category: 'Technology', description: '', date: '', image: '' });
    onClose();
  };

  const tabOptions = [
    { id: 'club' as const, label: 'New Club', icon: Building2, desc: 'Launch a community' },
    { id: 'project' as const, label: 'New Project', icon: Rocket, desc: 'Build an initiative' },
    { id: 'event' as const, label: 'New Event', icon: Calendar, desc: 'Host a seminar or meetup' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-slate-850">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FDF2F2] text-[#9E2A2B] rounded-xl shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-tight">Launch Initiative</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kickstart new nodes in the Atria network</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tabs Selection */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-3 gap-2">
              {tabOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = activeTab === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveTab(opt.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all focus:outline-none cursor-pointer ${
                      isSelected
                        ? 'bg-[#9E2A2B] border-transparent text-white font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-[11px] font-bold tracking-normal">{opt.label}</span>
                    <span className="text-[9px] text-slate-400 font-medium hidden sm:inline tracking-normal mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'club' && (
                <form onSubmit={handleClubSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Club Name <span className="text-[#9E2A2B] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Mobility Lab"
                      value={clubForm.name}
                      onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Category
                      </label>
                      <select
                        value={clubForm.category}
                        onChange={(e) => setClubForm({ ...clubForm, category: e.target.value as Club['category'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Arts">Arts</option>
                        <option value="Environment">Environment</option>
                        <option value="Business">Business</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Cover Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={clubForm.image}
                        onChange={(e) => setClubForm({ ...clubForm, image: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Mission & Description <span className="text-[#9E2A2B] font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe what the club is about, its objectives, and student roles..."
                      value={clubForm.description}
                      onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400 resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent"
                    >
                      <Plus className="w-4 h-4" /> Launch Club
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'project' && (
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Project Title <span className="text-[#9E2A2B] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quadcopter Navigation Mapping"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Related Community / Club
                      </label>
                      <select
                        value={projectForm.clubName}
                        onChange={(e) => setProjectForm({ ...projectForm, clubName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">Select a club...</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                        <option value="Atria Robotics Collective">Atria Robotics Collective</option>
                        <option value="Sustainability Society">Sustainability Society</option>
                        <option value="Digital Arts Lab">Digital Arts Lab</option>
                        <option value="Other / Independent">Other / Independent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Initiative Status Badge
                      </label>
                      <select
                        value={projectForm.badge}
                        onChange={(e) => setProjectForm({ ...projectForm, badge: e.target.value as Project['badge'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Recruiting">Recruiting (Open to join)</option>
                        <option value="Needs Mentor">Needs Mentor</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Primary Category Focus
                      </label>
                      <select
                        value={projectForm.category}
                        onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value as Project['category'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Arts">Arts</option>
                        <option value="Environment">Environment</option>
                        <option value="Business">Business</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="relative flex items-center gap-3 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
                        <input
                          type="checkbox"
                          checked={projectForm.needsMentor}
                          onChange={(e) => setProjectForm({ ...projectForm, needsMentor: e.target.checked })}
                          className="w-4 h-4 text-[#9E2A2B] border-slate-200 rounded focus:ring-[#9E2A2B] focus:outline-none bg-slate-50"
                        />
                        <span className="text-xs font-bold tracking-wide">Looking for Advisor</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Short Abstract & Goals <span className="text-[#9E2A2B] font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explain the goal of this project and roles you are recruiting for..."
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400 resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent"
                    >
                      <Plus className="w-4 h-4" /> Start Project
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'event' && (
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Event Title <span className="text-[#9E2A2B] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Next-Gen Web3 & AI Forum"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Date / Time Info <span className="text-[#9E2A2B] font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nov 14-16 or Wednesdays 4PM"
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        Category
                      </label>
                      <select
                        value={eventForm.category}
                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as Event['category'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Arts">Arts</option>
                        <option value="Environment">Environment</option>
                        <option value="Business">Business</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Event Cover Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={eventForm.image}
                      onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Description & Location <span className="text-[#9E2A2B] font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explain the agenda, keynote speakers, and details..."
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400 resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent"
                    >
                      <Plus className="w-4 h-4" /> Schedule Event
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
