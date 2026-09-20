// @ts-nocheck
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings, UserPlus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import LeadManager from '../components/LeadManager';

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canManage } = useAuth();
  const {
    communities,
    communityPosts,
    userCommunities,
    myLeadCommunities,
    joinCommunity,
    leaveCommunity,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    deleteCommunity,
    addCommunityLead,
    removeCommunityLead,
    refreshCommunityMembers,
  } = useApp();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showLeadManager, setShowLeadManager] = useState(false);

  const community = communities.find((c) => c.id === id);
  const isMember = id ? userCommunities.has(id) : false;
  const isLead = id ? myLeadCommunities.has(id) : false;
  const isAuthorOf = (authorId: string | null) => authorId === user?.id;

  const posts = useMemo(() => {
    return communityPosts
      .filter((p) => p.communityId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [communityPosts, id]);

  if (!community) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Community not found.</p>
        <button onClick={() => navigate('/')} className="mt-3 text-[#9E2A2B] text-sm font-semibold hover:underline cursor-pointer">
          Back to Feed
        </button>
      </div>
    );
  }

  const canPost = canManage || isLead;
  const canEditCommunity = canManage;
  const canDeleteCommunity = canManage;

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${community.name}"? This will remove all posts and members. This cannot be undone.`)) return;
    await deleteCommunity(community.id);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </button>

      {/* Community Header */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="relative h-40">
          {community.image ? (
            <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#9E2A2B] to-[#5C1A1B]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="p-6 -mt-8 relative">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{community.name}</h1>
              <p className="text-white/80 text-sm mt-1 max-w-lg">{community.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {canPost && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-sm font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Post
                </button>
              )}
              {canEditCommunity && (
                <button
                  onClick={() => setShowLeadManager(true)}
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold cursor-pointer flex items-center gap-1.5 border border-white/20"
                >
                  <UserPlus className="w-4 h-4" /> Leads
                </button>
              )}
              {canDeleteCommunity && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white text-sm font-semibold cursor-pointer flex items-center gap-1.5 border border-white/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-white/70 text-sm">
              <Users className="w-4 h-4" />
              <span>{community.memberCount || 0} members</span>
            </div>
            {isLead && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wide border border-amber-500/30">
                You are a Lead
              </span>
            )}
            {!isMember ? (
              <button
                onClick={() => id && joinCommunity(id)}
                className="px-4 py-1.5 rounded-full bg-white text-[#9E2A2B] text-sm font-semibold cursor-pointer hover:bg-white/90 transition-all"
              >
                Join Community
              </button>
            ) : (
              <button
                onClick={() => id && leaveCommunity(id)}
                className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-semibold cursor-pointer hover:bg-white/20 transition-all border border-white/20"
              >
                Leave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No posts in this community yet.</p>
          {canPost && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="mt-3 text-[#9E2A2B] text-sm font-semibold hover:underline cursor-pointer"
            >
              Create the first post
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthor={isAuthorOf(post.authorId)}
              isLead={isLead}
              isAdmin={canManage}
              onUpdate={updateCommunityPost}
              onDelete={deleteCommunityPost}
              onNavigateCommunity={(cid) => navigate(`/community/${cid}`)}
            />
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={createCommunityPost}
        communities={[community]}
        defaultCommunityId={community.id}
      />

      <LeadManager
        isOpen={showLeadManager}
        onClose={() => setShowLeadManager(false)}
        community={community}
        onAddLead={addCommunityLead}
        onRemoveLead={removeCommunityLead}
      />
    </div>
  );
}
