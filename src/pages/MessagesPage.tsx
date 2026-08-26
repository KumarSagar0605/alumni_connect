import { useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Mentor } from '../types';

export default function MessagesPage() {
  const { mentors, messages, setMessages, addToast } = useApp();

  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chatInput }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setMessages(resData.messages);
          setChatInput('');

          setTimeout(() => {
            const replyMsgText = "Understood. Let's schedule a deep-dive sync this week to align targets and review current milestones. Keep up the high-velocity focus!";
            fetch('/api/messages/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sender: selectedMentor ? selectedMentor.full_name : 'Dr. Elena Vance',
                avatar: selectedMentor
                  ? selectedMentor.avatar_url
                  : 'https://ui-avatars.com/api/?name=Dr.+Elena+Vance&background=9E2A2B&color=fff&size=200',
                text: replyMsgText,
                isMe: false,
              }),
            })
              .then((resReply) => resReply.json())
              .then((replyData) => {
                if (replyData.success) {
                  setMessages(replyData.messages);
                  addToast('New advisor message received!', 'info');
                }
              });
          }, 1200);
        }
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        addToast('Failed to send message via database', 'info');
      });
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md h-[550px] flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-150 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-150 bg-white">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-sans">Advisor Nodes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {mentors.slice(0, 3).map((m) => {
              const isSelected = selectedMentor ? selectedMentor.id === m.id : m.id === 'mentor-1';
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMentor(m)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-[#FDF2F2] text-[#9E2A2B] border-transparent shadow-xs'
                      : 'bg-transparent border-transparent hover:bg-slate-100/60 text-slate-600'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img src={m.avatar_url} alt={m.full_name} className="w-8.5 h-8.5 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                    {m.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-[#9E2A2B]' : 'text-slate-800'}`}>{m.full_name}</h4>
                    <p className={`text-[11px] truncate font-medium mt-0.5 ${isSelected ? 'text-rose-900/70 font-semibold' : 'text-slate-400'}`}>{m.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between bg-slate-50/20">
          <div className="px-5 py-3.5 bg-white border-b border-slate-150 flex items-center gap-3">
            <div className="relative">
              <img
                src={selectedMentor ? selectedMentor.avatar_url : 'https://ui-avatars.com/api/?name=Dr.+Elena+Vance&background=9E2A2B&color=fff&size=200'}
                alt={selectedMentor ? selectedMentor.full_name : 'Dr. Elena Vance'}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 font-sans">
                {selectedMentor ? selectedMentor.full_name : 'Dr. Elena Vance'}
              </h4>
              <p className="text-[10px] text-[#9E2A2B] font-bold tracking-wider mt-0.5 uppercase">
                LINK ESTABLISHED / SECURE NODE
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                  <p className={`text-[10px] text-slate-400 font-bold tracking-wide ${m.isMe ? 'text-right' : ''}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-150 flex items-center gap-2">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Type a message to ${selectedMentor ? selectedMentor.full_name.split(' ')[1] : 'Elena'}...`}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white border border-transparent shadow-xs transition-all cursor-pointer focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
