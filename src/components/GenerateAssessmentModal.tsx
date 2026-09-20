// @ts-nocheck
import { useState } from 'react';
import { X, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { createAssessment } from '../services/assessmentService';
import { useAuth } from '../hooks/useAuth';

interface GenerateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jdId: string;
  jdText: string;
  jdTitle: string;
  onGenerated: () => void;
}

export default function GenerateAssessmentModal({
  isOpen,
  onClose,
  jdId,
  jdText,
  jdTitle,
  onGenerated,
}: GenerateAssessmentModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(`${jdTitle} - Skill Verification`);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!user?.id || !title.trim()) return;
    if (!jdId || jdId === '') {
      setError('Opportunity not found. Please close and try again.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      await createAssessment(user.id, jdId, jdText, title.trim(), difficulty);
      setSuccess(true);
      setTimeout(() => {
        onGenerated();
        onClose();
        setSuccess(false);
        setTitle(`${jdTitle} - Skill Verification`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to generate assessment.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] flex items-center justify-center border border-rose-100">
              <Sparkles className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Generate Assessment</h3>
              <p className="text-[10px] text-slate-400 font-bold">AI-powered skill verification test</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900">Assessment Generated!</p>
            <p className="text-xs text-slate-500">10 questions created. Ready to invite students.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Assessment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#9E2A2B]"
                placeholder="e.g. Frontend Developer - Skill Test"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                      difficulty === d
                        ? 'bg-[#9E2A2B] text-white border-transparent'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-700/80 font-semibold">
                This will generate 10 questions (8 MCQ + 2 code debugging) using AI based on the JD. You can preview before sending to students.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !title.trim()}
                className="px-5 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl hover:bg-[#802223] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Test</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
