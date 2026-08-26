import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info';
}

interface ToastProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-sans">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white ${
              toast.type === 'success' ? 'border-l-4 border-l-emerald-500 border-slate-100' : 'border-l-4 border-l-[#9E2A2B] border-slate-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#9E2A2B] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold text-slate-700 tracking-tight leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-800 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
