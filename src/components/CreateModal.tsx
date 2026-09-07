import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Sparkles, Building2, Rocket, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { Club, Project, Event } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'club' | 'project' | 'event', data: any) => void;
  clubs: Club[];
}

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400";
const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5";

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUpload({ label, accept, value, onChange, preview, shape = 'rounded-xl' }: {
  label: string;
  accept?: string;
  value: string;
  onChange: (val: string) => void;
  preview?: string;
  shape?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await fileToDataURL(file);
    onChange(dataUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const displayImage = preview || value;

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {displayImage ? (
        <div className={`relative ${shape} overflow-hidden border border-slate-200 bg-slate-100`}>
          <img src={displayImage} alt="Preview" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={() => { onChange(''); if (fileRef.current) fileRef.current.value = ''; }}
            className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center py-6 border-2 border-dashed ${dragOver ? 'border-[#9E2A2B] bg-[#FDF2F2]/30' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'} ${shape} cursor-pointer transition-all`}
        >
          <Upload className="w-6 h-6 text-slate-400 mb-2" />
          <p className="text-[11px] font-bold text-slate-500">Click or drag to upload</p>
          <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept={accept || "image/*"} className="hidden" onChange={(e) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
      }} />
    </div>
  );
}

export default function CreateModal({ isOpen, onClose, onSubmit, clubs }: CreateModalProps) {
  const [activeTab, setActiveTab] = useState<'club' | 'project' | 'event'>('club');

  const [clubForm, setClubForm] = useState({
    name: '',
    category: 'Technology' as string,
    description: '',
    image: '',
    logo: '',
    tags: '',
    equipmentAccess: '',
    weeklyMeetings: '',
    resources: '',
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    category: 'Technology' as string,
    clubName: '',
    description: '',
    badge: 'Recruiting' as Project['badge'],
    needsMentor: false,
    techStack: '',
    lead: '',
    milestones: '',
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    category: 'Technology' as string,
    description: '',
    date: '',
    time: '',
    image: '',
    host: '',
    location: '',
    badge: 'Upcoming Event',
  });

  const handleClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubForm.name || !clubForm.description) return;
    const defaultImages: Record<string, string> = {
      Technology: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
      Environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
      Arts: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800',
      Business: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
      Social: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800',
    };
    const tags = clubForm.tags ? clubForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [clubForm.category, 'Community', 'Campus Life'];
    const resources = clubForm.resources ? clubForm.resources.split(',').map((r) => r.trim()).filter(Boolean) : [];
    onSubmit('club', {
      ...clubForm,
      tags,
      resources,
      logo: clubForm.logo || '',
      image: clubForm.image || defaultImages[clubForm.category],
      membersCount: 1,
      joined: true,
      tag: clubForm.category.substring(0, 4),
    });
    setClubForm({ name: '', category: 'Technology', description: '', image: '', logo: '', tags: '', equipmentAccess: '', weeklyMeetings: '', resources: '' });
    onClose();
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.description) return;
    const techStack = projectForm.techStack ? projectForm.techStack.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const milestones = projectForm.milestones
      ? projectForm.milestones.split('\n').filter(Boolean).map((m) => ({ name: m.trim(), done: false }))
      : [];
    onSubmit('project', {
      ...projectForm,
      clubName: projectForm.clubName || 'Atria Innovation Lab',
      progress: 0,
      mentored: false,
      joined: false,
      techStack,
      milestones,
      members: [],
    });
    setProjectForm({ name: '', category: 'Technology', clubName: '', description: '', badge: 'Recruiting', needsMentor: false, techStack: '', lead: '', milestones: '' });
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
      registeredCount: 1,
      registered: true,
    });
    setEventForm({ name: '', category: 'Technology', description: '', date: '', time: '', image: '', host: '', location: '', badge: 'Upcoming Event' });
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FDF2F2] text-[#9E2A2B] rounded-xl shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-tight">Launch Initiative</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kickstart new nodes in the Atria network</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tabs Selection */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-3 gap-2 shrink-0">
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
              {/* ========== CLUB FORM ========== */}
              {activeTab === 'club' && (
                <form onSubmit={handleClubSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Club Name <span className="text-[#9E2A2B] font-bold">*</span></label>
                    <input type="text" required placeholder="e.g. Smart Mobility Lab" value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={clubForm.category} onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })} className={inputCls + " cursor-pointer"}>
                        <option value="Technology">Technology</option>
                        <option value="Arts">Arts</option>
                        <option value="Environment">Environment</option>
                        <option value="Business">Business</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                    <div />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ImageUpload
                      label="Club Logo"
                      value={clubForm.logo}
                      onChange={(val) => setClubForm({ ...clubForm, logo: val })}
                      shape="rounded-2xl"
                    />
                    <ImageUpload
                      label="Cover / Background Image"
                      value={clubForm.image}
                      onChange={(val) => setClubForm({ ...clubForm, image: val })}
                      shape="rounded-2xl"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Mission & Description <span className="text-[#9E2A2B] font-bold">*</span></label>
                    <textarea required rows={3} placeholder="Describe what the club is about, its objectives, and student roles..." value={clubForm.description} onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })} className={inputCls + " resize-none"} />
                  </div>

                  <div>
                    <label className={labelCls}>Tags (comma separated)</label>
                    <input type="text" placeholder="e.g. AI, Robotics, Innovation" value={clubForm.tags} onChange={(e) => setClubForm({ ...clubForm, tags: e.target.value })} className={inputCls} />
                    <p className="text-[10px] text-slate-400 mt-1">If empty, defaults to: category, Community, Campus Life</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Weekly Meeting Schedule</label>
                      <input type="text" placeholder="e.g. Tuesdays @ 5:00 PM" value={clubForm.weeklyMeetings} onChange={(e) => setClubForm({ ...clubForm, weeklyMeetings: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Equipment Access</label>
                      <input type="text" placeholder="e.g. Standard booking via student portal" value={clubForm.equipmentAccess} onChange={(e) => setClubForm({ ...clubForm, equipmentAccess: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Resources (comma separated, optional)</label>
                    <input type="text" placeholder="e.g. Reservation Portal, Brand Kit, Alumni Network" value={clubForm.resources} onChange={(e) => setClubForm({ ...clubForm, resources: e.target.value })} className={inputCls} />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 font-semibold text-xs transition-all cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent">
                      <Plus className="w-4 h-4" /> Launch Club
                    </button>
                  </div>
                </form>
              )}

              {/* ========== PROJECT FORM ========== */}
              {activeTab === 'project' && (
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Project Title <span className="text-[#9E2A2B] font-bold">*</span></label>
                    <input type="text" required placeholder="e.g. Quadcopter Navigation Mapping" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Related Community / Club</label>
                      <select value={projectForm.clubName} onChange={(e) => setProjectForm({ ...projectForm, clubName: e.target.value })} className={inputCls + " cursor-pointer"}>
                        <option value="">Select a club...</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="Atria Robotics Collective">Atria Robotics Collective</option>
                        <option value="Sustainability Society">Sustainability Society</option>
                        <option value="Digital Arts Lab">Digital Arts Lab</option>
                        <option value="Other / Independent">Other / Independent</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Initiative Status Badge</label>
                      <select value={projectForm.badge} onChange={(e) => setProjectForm({ ...projectForm, badge: e.target.value as Project['badge'] })} className={inputCls + " cursor-pointer"}>
                        <option value="Recruiting">Recruiting (Open to join)</option>
                        <option value="Needs Mentor">Needs Mentor</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Primary Category Focus</label>
                      <select value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} className={inputCls + " cursor-pointer"}>
                        <option value="Technology">Technology</option>
                        <option value="Arts">Arts</option>
                        <option value="Environment">Environment</option>
                        <option value="Business">Business</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="relative flex items-center gap-3 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
                        <input type="checkbox" checked={projectForm.needsMentor} onChange={(e) => setProjectForm({ ...projectForm, needsMentor: e.target.checked })} className="w-4 h-4 text-[#9E2A2B] border-slate-200 rounded focus:ring-[#9E2A2B] focus:outline-none bg-slate-50" />
                        <span className="text-xs font-bold tracking-wide">Looking for Advisor</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Short Abstract & Goals <span className="text-[#9E2A2B] font-bold">*</span></label>
                    <textarea required rows={3} placeholder="Explain the goal of this project and roles you are recruiting for..." value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className={inputCls + " resize-none"} />
                  </div>

                  <div>
                    <label className={labelCls}>Tech Stack (comma separated)</label>
                    <input type="text" placeholder="e.g. React, TypeScript, Node.js, PostgreSQL" value={projectForm.techStack} onChange={(e) => setProjectForm({ ...projectForm, techStack: e.target.value })} className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Project Lead Name</label>
                    <input type="text" placeholder="e.g. Alex Kumar" value={projectForm.lead} onChange={(e) => setProjectForm({ ...projectForm, lead: e.target.value })} className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Milestones (one per line, optional)</label>
                    <textarea rows={3} placeholder={"Phase 1: Planning\nPhase 2: MVP Development\nPhase 3: Testing & QA\nPhase 4: Deployment"} value={projectForm.milestones} onChange={(e) => setProjectForm({ ...projectForm, milestones: e.target.value })} className={inputCls + " resize-none"} />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 font-semibold text-xs transition-all cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent">
                      <Plus className="w-4 h-4" /> Start Project
                    </button>
                  </div>
                </form>
              )}

              {/* ========== EVENT FORM ========== */}
              {activeTab === 'event' && (
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Event Title <span className="text-[#9E2A2B] font-bold">*</span></label>
                    <input type="text" required placeholder="e.g. Next-Gen Web3 & AI Forum" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Date <span className="text-[#9E2A2B] font-bold">*</span></label>
                      <input type="text" required placeholder="e.g. Oct 24, 2024 or Nov 14-16" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Time</label>
                      <input type="text" placeholder="e.g. 5:30 PM - 8:00 PM" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} className={inputCls + " cursor-pointer"}>
                        <option value="Technology">Technology</option>
                        <option value="Arts">Arts</option>
                        <option value="Environment">Environment</option>
                        <option value="Business">Business</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Status Badge</label>
                      <select value={eventForm.badge} onChange={(e) => setEventForm({ ...eventForm, badge: e.target.value })} className={inputCls + " cursor-pointer"}>
                        <option value="Upcoming Event">Upcoming Event</option>
                        <option value="Featured Series">Featured Series</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Social Gathering">Social Gathering</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Host / Organizer</label>
                      <input type="text" placeholder="e.g. Atria Tech Club" value={eventForm.host} onChange={(e) => setEventForm({ ...eventForm, host: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Location / Venue</label>
                      <input type="text" placeholder="e.g. Atria Grand Hall & Virtual" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  <ImageUpload
                    label="Event Cover Image"
                    value={eventForm.image}
                    onChange={(val) => setEventForm({ ...eventForm, image: val })}
                    shape="rounded-2xl"
                  />

                  <div>
                    <label className={labelCls}>Description & Agenda <span className="text-[#9E2A2B] font-bold">*</span></label>
                    <textarea required rows={4} placeholder="Explain the agenda, keynote speakers, workshop details, and what attendees can expect..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className={inputCls + " resize-none"} />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 font-semibold text-xs transition-all cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent">
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
