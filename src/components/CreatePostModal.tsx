// @ts-nocheck
import { useState } from 'react';
import { X, Megaphone, CalendarDays, Bell, Image } from 'lucide-react';
import { Community } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    communityId: string;
    title: string;
    content: string;
    postType: 'event' | 'announcement' | 'update';
    image?: string;
    eventDate?: string;
  }) => void;
  communities: Community[];
  defaultCommunityId?: string;
}

const POST_TYPES = [
  { value: 'update' as const, label: 'Update', icon: Bell, desc: 'Share a quick update', color: 'emerald' },
  { value: 'announcement' as const, label: 'Announcement', icon: Megaphone, desc: 'Important news', color: 'amber' },
  { value: 'event' as const, label: 'Event', icon: CalendarDays, desc: 'Upcoming event', color: 'blue' },
];

export default function CreatePostModal({ isOpen, onClose, onSubmit, communities, defaultCommunityId }: CreatePostModalProps) {
  const [communityId, setCommunityId] = useState(defaultCommunityId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'event' | 'announcement' | 'update'>('update');
  const [image, setImage] = useState('');
  const [eventDate, setEventDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!communityId || !title.trim()) return;
    onSubmit({
      communityId,
      title: title.trim(),
      content: content.trim(),
      postType,
      image: image || undefined,
      eventDate: postType === 'event' && eventDate ? new Date(eventDate).toISOString() : undefined,
    });
    setTitle('');
    setContent('');
    setImage('');
    setEventDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Create Post</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share with your community</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Community Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Community</label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] transition-all bg-white"
            >
              <option value="">Select a community...</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Post Type */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {POST_TYPES.map((t) => {
                const active = postType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setPostType(t.value)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                      active
                        ? 'border-[#9E2A2B] bg-[#FDF2F2] text-[#9E2A2B]'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <t.icon className={`w-5 h-5 ${active ? 'text-[#9E2A2B]' : ''}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] transition-all"
              placeholder="What's the headline?"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] resize-none transition-all"
              placeholder="Write your post content..."
            />
          </div>

          {/* Event Date */}
          {postType === 'event' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Event Date & Time</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] transition-all"
              />
            </div>
          )}

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Image URL <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 text-sm font-semibold cursor-pointer transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!communityId || !title.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-[#9E2A2B]/20"
          >
            Publish Post
          </button>
        </div>
      </div>
    </div>
  );
}
