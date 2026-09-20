// @ts-nocheck
import { useState } from 'react';
import { Megaphone, CalendarDays, Bell, Trash2, Pencil, X, Check, Heart, MessageCircle, Share2 } from 'lucide-react';
import { CommunityPost } from '../types';

interface PostCardProps {
  post: CommunityPost;
  isAuthor: boolean;
  isLead: boolean;
  isAdmin: boolean;
  onUpdate: (id: string, data: Partial<CommunityPost>) => void;
  onDelete: (id: string) => void;
  onNavigateCommunity: (id: string) => void;
}

const TYPE_CONFIG = {
  event: {
    icon: CalendarDays,
    label: 'Event',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    dot: 'bg-blue-500',
  },
  announcement: {
    icon: Megaphone,
    label: 'Announcement',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    dot: 'bg-amber-500',
  },
  update: {
    icon: Bell,
    label: 'Update',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    dot: 'bg-emerald-500',
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PostCard({ post, isAuthor, isLead, isAdmin, onUpdate, onDelete, onNavigateCommunity }: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(false);

  const cfg = TYPE_CONFIG[post.postType] || TYPE_CONFIG.update;
  const Icon = cfg.icon;
  const canEdit = isAuthor || isLead || isAdmin;

  const handleSave = () => {
    onUpdate(post.id, { title, content });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    onDelete(post.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
      {/* Post Type Accent Bar */}
      <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
                {post.author?.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-bold bg-gradient-to-br from-slate-100 to-slate-200">
                    {post.author?.fullName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${cfg.dot} border-2 border-white flex items-center justify-center`}>
                <Icon className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{post.author?.fullName || 'Unknown'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {post.community && (
                  <button
                    onClick={() => onNavigateCommunity(post.community!.id)}
                    className="text-[11px] font-semibold text-[#9E2A2B] hover:text-[#802223] cursor-pointer transition-colors"
                  >
                    {post.community.name}
                  </button>
                )}
                {post.community && <span className="text-slate-300">·</span>}
                <span className="text-[11px] text-slate-400">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
              <Icon className="w-3 h-3" /> {cfg.label}
            </span>
            {canEdit && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-50 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        {editing ? (
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] transition-all"
              placeholder="Post title"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/10 focus:border-[#9E2A2B] resize-none transition-all"
              placeholder="What's on your mind?"
            />
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
              <button onClick={() => { setEditing(false); setTitle(post.title); setContent(post.content); }} className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{post.title}</h3>
            {post.content && (
              <p className="text-slate-600 text-sm mt-2 leading-relaxed whitespace-pre-line">{post.content}</p>
            )}
            {post.image && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-100">
                <img src={post.image} alt="" className="w-full max-h-80 object-cover" />
              </div>
            )}
            {post.eventDate && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">
                  {new Date(post.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {!editing && (
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                liked ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} /> Like
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" /> Comment
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
