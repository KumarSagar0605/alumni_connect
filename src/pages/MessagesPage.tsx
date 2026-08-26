import { useState, useRef, useEffect } from 'react';
import { Send, Search, Circle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Mentor } from '../types';

const mentorReplies: Record<string, string[]> = {
  default: [
    "That's a great question! Let me think about the best approach for your specific use case.",
    "I'd recommend breaking this down into smaller, iterative milestones. Start with an MVP and gather feedback early.",
    "From my experience, the key challenge here will be scalability. Let's discuss architectural patterns that work well.",
    "Absolutely — I can help you refine that idea. Let's schedule a sync to go deeper into the technical trade-offs.",
    "That aligns well with current industry trends. I'll share some relevant case studies for reference.",
    "Good progress so far! Keep pushing the boundaries, and don't hesitate to reach out if you hit blockers.",
    "I've seen similar challenges in previous cohorts. Here's what worked best for them...",
    "Let me connect you with a peer who tackled a very similar problem last semester.",
  ],
  'mentor-1': [
    "As your assigned advisor, I'm fully aligned with your project goals. Let's make this semester count.",
    "I reviewed the latest progress update — the direction is solid. A few adjustments to the data pipeline could improve throughput by 20%.",
    "Let's set up a 30-minute deep-dive this week. I want to walk through the architecture diagram together.",
    "Great initiative on the feature request. I'll review the PR this evening and leave detailed feedback.",
  ],
  'mentor-2': [
    "That's exactly the kind of creative thinking I love to see in student projects!",
    "I have some contacts in the industry who might be interested in this. Let me make some introductions.",
    "Consider adding user testing sessions early — it'll save you weeks of rework later.",
    "Love the ambition. Let's map out a realistic timeline so we can track progress effectively.",
  ],
  'mentor-3': [
    "I'll be honest — that's a challenging problem. But I've seen students conquer similar challenges before.",
    "Let's approach this systematically. First, let's define the success criteria clearly.",
    "I can share some research papers that might help you approach this from a different angle.",
    "Keep me updated on the blocker — if it's architectural, I want to review it before you invest more time.",
  ],
};

function getMentorReply(mentorId: string): string {
  const replies = mentorReplies[mentorId] || mentorReplies.default;
  return replies[Math.floor(Math.random() * replies.length)];
}

function getCurrentTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function MessagesPage() {
  const { mentors, messages, setMessages, addToast } = useApp();

  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(mentors[0] || null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (selectedMentor) chatInputRef.current?.focus();
  }, [selectedMentor]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedMentor) return;

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      sender: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
      text: chatInput.trim(),
      timestamp: getCurrentTimestamp(),
      isMe: true,
      mentorId: selectedMentor.id,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setIsTyping(true);

    const delay = 800 + Math.random() * 1500;
    setTimeout(() => {
      const replyText = getMentorReply(selectedMentor.id);
      const mentorMsg = {
        id: `msg-${Date.now()}-mentor`,
        sender: selectedMentor.full_name,
        avatar: selectedMentor.avatar_url,
        text: replyText,
        timestamp: getCurrentTimestamp(),
        isMe: false,
        mentorId: selectedMentor.id,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, mentorMsg]);
      addToast(`New message from ${selectedMentor.full_name}`, 'info');
    }, delay);
  };

  const filteredMentors = mentors.filter((m) =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md h-[550px] flex overflow-hidden">
        {/* Left Sidebar: Mentor List */}
        <div className="w-1/3 border-r border-slate-200/80 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200/80 bg-white space-y-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-sans">Advisor Nodes</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advisors..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredMentors.map((m) => {
              const isSelected = selectedMentor?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMentor(m);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-[#FDF2F2] text-[#9E2A2B] border-transparent shadow-xs'
                      : 'bg-transparent border-transparent hover:bg-slate-100/60 text-slate-600'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={m.avatar_url}
                      alt={m.full_name}
                      className="w-8.5 h-8.5 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    {m.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-[#9E2A2B]' : 'text-slate-800'}`}>
                      {m.full_name}
                    </h4>
                    <p className={`text-[11px] truncate font-medium mt-0.5 ${isSelected ? 'text-rose-900/70 font-semibold' : 'text-slate-400'}`}>
                      {m.role}
                    </p>
                  </div>
                  {m.online && (
                    <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
            {filteredMentors.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No advisors found.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="flex-1 flex flex-col justify-between bg-slate-50/20">
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center gap-3">
            {selectedMentor ? (
              <>
                <div className="relative">
                  <img
                    src={selectedMentor.avatar_url}
                    alt={selectedMentor.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  {selectedMentor.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 font-sans">{selectedMentor.full_name}</h4>
                  <p className="text-[10px] text-[#9E2A2B] font-bold tracking-wider mt-0.5 uppercase">
                    {selectedMentor.online ? 'Online / Secure Node' : 'Offline / Last seen 2h ago'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Circle className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 font-sans">Select an advisor</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">No conversation active</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Send className="w-7 h-7 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-600">Start a conversation</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">Select an advisor and send your first message</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-3 max-w-[85%] ${m.isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                <img
                  src={m.avatar}
                  alt={m.sender}
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs border ${
                      m.isMe
                        ? 'bg-[#9E2A2B] text-white border-transparent rounded-tr-none'
                        : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <p className={`text-[10px] text-slate-400 font-bold tracking-wide flex items-center gap-1 ${m.isMe ? 'justify-end' : ''}`}>
                    <Clock className="w-3 h-3" />
                    {m.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && selectedMentor && (
              <div className="flex items-start gap-3 max-w-[85%]">
                <img
                  src={selectedMentor.avatar_url}
                  alt={selectedMentor.full_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
            <input
              ref={chatInputRef}
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!selectedMentor}
              placeholder={selectedMentor ? `Message ${selectedMentor.full_name.split(' ')[1]}...` : 'Select an advisor first...'}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!selectedMentor || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white border border-transparent shadow-xs transition-all cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
