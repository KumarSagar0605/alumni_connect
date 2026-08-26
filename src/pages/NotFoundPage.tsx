import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-6xl font-extrabold text-slate-200">404</h1>
        <p className="text-sm font-bold text-slate-500">Page not found</p>
      </motion.div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
      >
        <Home className="w-4 h-4" /> Go Home
      </motion.button>
    </div>
  );
}
