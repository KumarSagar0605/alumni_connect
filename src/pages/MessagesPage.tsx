// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Search, Circle, Clock, ArrowLeft, UserPlus, MessageSquare, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { getMyAssessments } from '../services/assessmentService';
import InviteStudentModal from '../components/InviteStudentModal';
import type { EligibleMentor, Conversation, ChatMessage } from '../types';
import {
  getEligibleMentors,
  getOrCreateConversation,
  getOrCreateDirectConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage as sendMsg,
  markConversationRead,
  subscribeToMessages,
} from '../services/messagingService';
import { supabase } from '../supabaseClient';

export default function MessagesPage() {
  const { user, userRole } = useAuth();
  const { addToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [eligibleMentors, setEligibleMentors] = useState<EligibleMentor[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'new'>('chats');

  // Assessment state
  const [myAssessments, setMyAssessments] = useState([]);
  const [inviteModal, setInviteModal] = useState({ open: false, studentUserId: '', studentName: '', conversationId: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    const convs = await getUserConversations(user.id);
    setConversations(convs);
  }, [user?.id]);

  // Load eligible mentors
  const loadEligibleMentors = useCallback(async () => {
    if (!user?.id) return;
    const mentors = await getEligibleMentors(user.id);
    setEligibleMentors(mentors);
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadConversations(), loadEligibleMentors()]);
      setLoading(false);
    };
    init();
  }, [loadConversations, loadEligibleMentors]);

  // Load assessments for alumni
  useEffect(() => {
    if (!user?.id || userRole === 'student') return;
    getMyAssessments(user.id).then(setMyAssessments);
  }, [user?.id, userRole]);

  // Handle ?user_id=XXX query param — open/create direct conversation
  useEffect(() => {
    const targetUserId = searchParams.get('user_id');
    if (!targetUserId || !user?.id || loading) return;

    const openDirectChat = async () => {
      const conv = await getOrCreateDirectConversation(user.id, targetUserId);
      if (conv) {
        // Enrich with recipient info
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, user_id')
          .eq('user_id', targetUserId)
          .single();
        if (recipientProfile) {
          conv.mentorName = recipientProfile.full_name;
          conv.mentorAvatar = recipientProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientProfile.full_name)}&background=9E2A2B&color=fff&size=200`;
          conv.mentorUserId = recipientProfile.user_id;
          conv.projectName = 'Direct Message';
        }

        setConversations(prev => {
          const exists = prev.find(c => c.id === conv.id);
          if (exists) return prev;
          return [conv, ...prev];
        });

        setSelectedConversation(conv);
        setActiveTab('chats');
      }
      // Clean up the URL param
      setSearchParams({});
    };

    openDirectChat();
  }, [searchParams, user?.id, loading, setSearchParams]);

  // Subscribe to conversation list changes (debounced)
  const loadConversationsRef = useRef(loadConversations);
  loadConversationsRef.current = loadConversations;

  useEffect(() => {
    if (!user?.id) return;

    let timeout: ReturnType<typeof setTimeout>;
    const debouncedReload = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadConversationsRef.current(), 1000);
    };

    const sub = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        debouncedReload
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      sub.unsubscribe();
    };
  }, [user?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user?.id) {
      setChatMessages([]);
      return;
    }

    const loadMessages = async () => {
      const msgs = await getConversationMessages(selectedConversation.id, user.id);
      setChatMessages(msgs);
      markConversationRead(selectedConversation.id, user.id);
    };
    loadMessages();

    // Subscribe to new messages
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    channelRef.current = subscribeToMessages(selectedConversation.id, (newMsg) => {
      setChatMessages((prev) => [...prev, newMsg]);
      loadConversations();
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [selectedConversation?.id, user?.id, loadConversations]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Focus input when conversation changes
  useEffect(() => {
    if (selectedConversation) chatInputRef.current?.focus();
  }, [selectedConversation]);

  // Start a new conversation with an eligible mentor
  const handleStartConversation = async (mentor: EligibleMentor) => {
    if (!user?.id) return;

    const conv = await getOrCreateConversation(user.id, mentor.mentorProfileId, mentor.projectId);
    if (conv) {
      // Enrich with mentor data
      conv.mentorName = mentor.mentorName;
      conv.mentorAvatar = mentor.mentorAvatar;
      conv.mentorUserId = mentor.mentorUserId;
      conv.projectName = mentor.projectName;

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });

      setSelectedConversation(conv);
      setActiveTab('chats');
      addToast(`Conversation started with ${mentor.mentorName}`, 'success');
    }
  };

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConversation || !user?.id || sending) return;

    const text = chatInput.trim();
    setChatInput('');
    setSending(true);

    try {
      const newMsg = await sendMsg(selectedConversation.id, user.id, text);
      if (newMsg) {
        setChatMessages((prev) => [...prev, newMsg]);
        // Update conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessageText: text, lastMessageAt: new Date().toISOString() }
              : c
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
      } else {
        addToast('Failed to send message. You may not have permission.', 'info');
        setChatInput(text);
      }
    } catch {
      addToast('Failed to send message.', 'info');
      setChatInput(text);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) =>
    c.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter eligible mentors by search
  const filteredMentors = eligibleMentors.filter((m) =>
    m.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group eligible mentors by mentor (deduplicate across projects)
  const uniqueMentors = eligibleMentors.reduce((acc, m) => {
    const existing = acc.find((a) => a.mentorProfileId === m.mentorProfileId);
    if (existing) {
      existing.projects.push({ id: m.projectId, name: m.projectName });
    } else {
      acc.push({
        ...m,
        projects: [{ id: m.projectId, name: m.projectName }],
      });
    }
    return acc;
  }, [] as (EligibleMentor & { projects: { id: string; name: string }[] })[]);

  const filteredUniqueMentors = uniqueMentors.filter((m) =>
    m.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.projects.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessageText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline opacity-90 hover:opacity-100 break-all"
          >
            {part.length > 50 ? part.slice(0, 47) + '...' : part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Messages</h1>
        <p className="text-xs text-slate-500 font-medium">
          Chat with your project mentors. Only student-alumni messaging is allowed.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md h-[600px] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 md:w-[340px] border-r border-slate-200/80 flex flex-col bg-white shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-200/80 bg-white">
            <button
              onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'chats'
                  ? 'text-[#9E2A2B] border-b-2 border-[#9E2A2B]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => { setActiveTab('new'); setSearchQuery(''); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer relative ${
                activeTab === 'new'
                  ? 'text-[#9E2A2B] border-b-2 border-[#9E2A2B]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                New Chat
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search mentors or projects...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {activeTab === 'chats' ? (
              <>
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">
                      {conversations.length === 0 ? 'No conversations yet' : 'No matching conversations'}
                    </p>
                    {conversations.length === 0 && (
                      <button
                        onClick={() => setActiveTab('new')}
                        className="mt-2 text-[11px] text-[#9E2A2B] font-bold hover:underline cursor-pointer"
                      >
                        Start a new chat
                      </button>
                    )}
                  </div>
                )}
                {filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { setSelectedConversation(conv); setSearchQuery(''); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FDF2F2] text-[#9E2A2B] border-transparent shadow-xs'
                          : 'bg-transparent border-transparent hover:bg-slate-100/60 text-slate-600'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={conv.mentorAvatar}
                          alt={conv.mentorName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#9E2A2B]' : 'text-slate-800'}`}>
                            {conv.mentorName}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0 ml-2">
                            {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{conv.projectName}</p>
                        {conv.lastMessageText && (
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{conv.lastMessageText}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                {filteredUniqueMentors.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <UserPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">
                      {eligibleMentors.length === 0
                        ? 'No eligible mentors found'
                        : 'No matching mentors'}
                    </p>
                    {eligibleMentors.length === 0 && (
                      <p className="text-[10px] text-slate-300 mt-1">
                        Mentors appear here when they are assigned to your projects
                      </p>
                    )}
                  </div>
                )}
                {filteredUniqueMentors.map((mentor) => (
                  <button
                    key={mentor.mentorProfileId}
                    onClick={() => handleStartConversation(mentor)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left border border-transparent hover:bg-slate-100/60 text-slate-600 transition-all cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={mentor.mentorAvatar}
                        alt={mentor.mentorName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{mentor.mentorName}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mentor.projects.slice(0, 2).map((p) => (
                          <span key={p.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                            {p.name}
                          </span>
                        ))}
                        {mentor.projects.length > 2 && (
                          <span className="text-[9px] text-slate-400 font-bold">+{mentor.projects.length - 2}</span>
                        )}
                      </div>
                    </div>
                    <Send className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="flex-1 flex flex-col justify-between bg-slate-50/20">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <img
                    src={selectedConversation.mentorAvatar}
                    alt={selectedConversation.mentorName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">{selectedConversation.mentorName}</h4>
                  <p className="text-[10px] text-[#9E2A2B] font-bold tracking-wider mt-0.5 uppercase">
                    {selectedConversation.projectName}
                  </p>
                </div>
                {userRole !== 'student' && myAssessments.length > 0 && selectedConversation.mentorUserId && (
                  <button
                    onClick={() => setInviteModal({
                      open: true,
                      studentUserId: selectedConversation.mentorUserId,
                      studentName: selectedConversation.mentorName,
                      conversationId: selectedConversation.id,
                    })}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1.5 transition-all"
                    title="Send Verification Test"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" /> Send Test
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Send className="w-7 h-7 text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-600">Start the conversation</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Send a message to {selectedConversation.mentorName.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                )}
                {chatMessages.map((m) => (
                  <div key={m.id} className={`flex items-start gap-3 max-w-[85%] ${m.isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                    <img
                      src={m.senderAvatar}
                      alt={m.senderName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <div
                        className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs border max-w-full break-words ${
                          m.isMe
                            ? 'bg-[#9E2A2B] text-white border-transparent rounded-tr-none'
                            : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                        }`}
                      >
                        {renderMessageText(m.text)}
                      </div>
                      <p className={`text-[10px] text-slate-400 font-bold tracking-wide flex items-center gap-1 ${m.isMe ? 'justify-end' : ''}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  required
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${selectedConversation.mentorName.split(' ')[0]}...`}
                  disabled={sending}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sending}
                  className="p-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white border border-transparent shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 px-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-600">
                  {activeTab === 'new' ? 'Select a mentor' : 'Select a conversation'}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {activeTab === 'new'
                    ? 'Choose an eligible mentor to start chatting'
                    : 'Pick a conversation from the sidebar to start messaging'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <InviteStudentModal
        isOpen={inviteModal.open}
        onClose={() => setInviteModal({ open: false, studentUserId: '', studentName: '', conversationId: '' })}
        assessmentId={myAssessments[0]?.id || ''}
        studentUserId={inviteModal.studentUserId}
        studentName={inviteModal.studentName}
        conversationId={inviteModal.conversationId}
        onInvited={() => addToast('Test invitation sent!', 'success')}
      />
    </div>
  );
}
