import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function MentorsPage() {
  const navigate = useNavigate();
  const { mentors, addToast } = useApp();

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Advisor Pool</h1>
          <p className="text-xs text-slate-500 font-medium">Tap directly into academic chairs, senior scientists, and research advisors.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white border border-slate-150 rounded-2xl p-5 text-center flex flex-col items-center justify-between shadow-xs hover:border-slate-300 transition-all group relative"
            >
              {mentor.online && (
                <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  ONLINE
                </span>
              )}

              <div className="space-y-4 pt-4">
                <div className="relative inline-block">
                  <img
                    src={mentor.avatar_url}
                    alt={mentor.full_name}
                    className="w-18 h-18 rounded-full object-cover border border-slate-200 shadow-sm mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-[#9E2A2B] transition-colors leading-snug">
                    {mentor.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold tracking-tight mt-1">{mentor.role}</p>
                </div>
              </div>

              <div className="pt-6 w-full space-y-2">
                <button
                  onClick={() => {
                    addToast(`Initiating connection with ${mentor.full_name}...`, 'info');
                    navigate('/messages');
                  }}
                  className="w-full py-2 px-3 bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Send Message
                </button>
                <button
                  onClick={() => {
                    addToast(`Requested advice session with ${mentor.full_name}.`, 'success');
                  }}
                  className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Request Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
