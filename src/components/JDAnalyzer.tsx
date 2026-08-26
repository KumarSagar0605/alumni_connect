import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Loader2,
  Search,
  Trophy,
  Medal,
  Award,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  Save,
  FileText,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { rankStudentsAgainstJD, type RankedStudent } from '../services/geminiService';

export default function JDAnalyzer() {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [rankings, setRankings] = useState<RankedStudent[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<{ id: string; title: string; description: string; rankings: RankedStudent[]; created_at: string }[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jd_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setSavedAnalyses(data);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      addToast('Please enter a job description.', 'info');
      return;
    }

    setAnalyzing(true);
    setRankings([]);

    try {
      // Fetch all student resumes
      const { data: resumes, error: resumeError } = await supabase
        .from('resumes')
        .select('user_id, full_name, skills, cgpa, summary, projects, experience');

      if (resumeError) throw resumeError;

      if (!resumes || resumes.length === 0) {
        addToast('No student resumes found in the system yet.', 'info');
        setAnalyzing(false);
        return;
      }

      // Rank students using AI
      const ranked = await rankStudentsAgainstJD(jdText, resumes);
      setRankings(ranked);
      addToast(`Analyzed ${ranked.length} candidates.`, 'success');
    } catch (err: any) {
      console.error('Analysis error:', err);
      addToast(`Analysis failed: ${err.message}`, 'info');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!jdTitle.trim()) {
      addToast('Please enter a title for this analysis.', 'info');
      return;
    }
    if (rankings.length === 0) {
      addToast('Run an analysis first before saving.', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('jd_analyses')
        .insert([{
          user_id: user.id,
          title: jdTitle,
          description: jdText,
          rankings: rankings,
        }]);

      if (error) throw error;
      addToast('Analysis saved successfully!', 'success');
      fetchSavedAnalyses();
      setJdTitle('');
    } catch (err) {
      addToast('Failed to save analysis.', 'info');
    }
  };

  const loadAnalysis = (analysis: { title: string; description: string; rankings: RankedStudent[]; id: string }) => {
    setJdTitle(analysis.title);
    setJdText(analysis.description);
    setRankings(analysis.rankings);
    setSelectedAnalysis(analysis.id);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-[11px] font-black text-slate-400">#{index + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-[#9E2A2B] bg-[#FDF2F2] border-rose-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* JD Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">JD Ranker</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Rank students against a job description</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis Title</label>
            <input
              type="text"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              placeholder="e.g. Frontend Developer @ Google"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[#9E2A2B] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Description</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here... Include required skills, qualifications, and responsibilities for best ranking results."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium leading-relaxed focus:outline-none focus:border-[#9E2A2B] focus:bg-white resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !jdText.trim()}
              className="px-6 py-2.5 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Candidates...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Rank Candidates
                </>
              )}
            </button>

            {rankings.length > 0 && (
              <button
                onClick={handleSaveAnalysis}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Analysis
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rankings Results */}
      {rankings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9E2A2B]" />
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Ranked Candidates ({rankings.length})
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              Sorted by match score
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {rankings.map((student, index) => (
              <RankingCard
                key={student.user_id}
                student={student}
                rank={index}
                getRankIcon={getRankIcon}
                getScoreColor={getScoreColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved Analyses */}
      {savedAnalyses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Saved Analyses</h4>
          </div>

          <div className="divide-y divide-slate-100">
            {savedAnalyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => loadAnalysis(analysis)}
                className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors ${
                  selectedAnalysis === analysis.id ? 'bg-[#FDF2F2]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{analysis.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {analysis.rankings.length} candidates ranked • {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Top: {analysis.rankings[0]?.full_name || 'N/A'} ({analysis.rankings[0]?.score.toFixed(0) || 0}%)
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && savedAnalyses.length === 0 && rankings.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">No analyses yet</p>
          <p className="text-[11px] text-slate-300 mt-1">Enter a job description above to rank student candidates</p>
        </div>
      )}
    </div>
  );
}

function RankingCard({
  student,
  rank,
  getRankIcon,
  getScoreColor,
}: {
  student: RankedStudent;
  rank: number;
  getRankIcon: (i: number) => React.ReactNode;
  getScoreColor: (s: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="shrink-0">{getRankIcon(rank)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h5 className="text-sm font-extrabold text-slate-900 truncate">{student.full_name}</h5>
            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${getScoreColor(student.score)}`}>
              {student.score.toFixed(0)}% Match
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              CGPA: {student.cgpa.toFixed(1)}
            </span>
          </div>

          {student.resume_summary && (
            <p className="text-[11px] text-slate-500 font-medium mt-1">{student.resume_summary}</p>
          )}

          {/* Matched skills preview */}
          <div className="flex flex-wrap gap-1 mt-2">
            {student.matched_skills.slice(0, 6).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-100">
                {skill}
              </span>
            ))}
            {student.matched_skills.length > 6 && (
              <span className="px-2 py-0.5 text-[9px] font-bold text-slate-400">
                +{student.matched_skills.length - 6} more
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 ml-9 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matched Skills */}
            <div className="space-y-1.5">
              <h6 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Matched Skills</h6>
              <div className="flex flex-wrap gap-1">
                {student.matched_skills.length > 0 ? (
                  student.matched_skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No skills matched</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="space-y-1.5">
              <h6 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Missing from JD</h6>
              <div className="flex flex-wrap gap-1">
                {student.unmatched_jd_skills.length > 0 ? (
                  student.unmatched_jd_skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">All JD skills covered</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
