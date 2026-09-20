// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Sparkles,
  X,
  MessageSquare,
  Download,
  Lightbulb,
  Send,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  Users,
  Search,
  Trophy,
  Medal,
  Award,
  ChevronDown,
  ChevronUp,
  Star,
  Plus,
  Trash2,
  Shield,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { rankStudentsAgainstJD, type RankedStudent } from '../services/geminiService';
import { hasAssessmentForJD, getCompositeScoresForJD, saveResumeMatchScores } from '../services/assessmentService';
import GenerateAssessmentModal from '../components/GenerateAssessmentModal';
import InviteStudentModal from '../components/InviteStudentModal';

const STORAGE_KEY_PREFIX = 'cia_opportunities_';

interface SavedOpportunity {
  title: string;
  department: string;
  location: string;
  experience: string;
  compensation: string;
  skills: string[];
  description: string;
  candidates: MatchedCandidate[];
  savedAt: string;
}

interface MatchedCandidate {
  user_id: string;
  full_name: string;
  skills: string[];
  cgpa: number;
  summary: string;
  matchScore: number;
  matched_skills: string[];
  unmatched_jd_skills: string[];
  shortlisted: boolean;
}

export default function Opportunities() {
  const { addToast, user } = useApp();
  const navigate = useNavigate();

  // User-specific storage key
  const storageKey = user?.id ? `cia_opportunities_${user.id}` : null;

  // Form state — initialized from sessionStorage
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('Intermediate (Year 3+)');
  const [compensation, setCompensation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [description, setDescription] = useState('');
  const [opportunityId, setOpportunityId] = useState<string | null>(null);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'cgpa'>('match');
  const [filterSkill, setFilterSkill] = useState('All');
  const [candidates, setCandidates] = useState<MatchedCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Message modal
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgTargetName, setMsgTargetName] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgBroadcast, setMsgBroadcast] = useState(false);

  // Assessment state
  const { userRole } = useAuth();
  const [existingAssessment, setExistingAssessment] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [inviteModal, setInviteModal] = useState<{ open: boolean; studentUserId: string; studentName: string }>({ open: false, studentUserId: '', studentName: '' });
  const [compositeScores, setCompositeScores] = useState({});
  const [sortByVerified, setSortByVerified] = useState(false);

  // Load from sessionStorage on mount, then try Supabase
  useEffect(() => {
    // 1) Restore from sessionStorage first (instant)
    try {
      const saved = storageKey ? sessionStorage.getItem(storageKey) : null;
      if (saved) {
        const parsed: SavedOpportunity = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.compensation) setCompensation(parsed.compensation);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.candidates && parsed.candidates.length > 0) {
          setCandidates(parsed.candidates);
          setHasSearched(true);
        }
      }
    } catch {}

    // 2) Also try Supabase as backup
    const fetchOpportunity = async () => {
      const { data } = await supabase.from('opportunities').select('*').limit(1).single();
      if (data && data.title !== 'Initial Opportunity') {
        setOpportunityId(data.id);
        // Supabase data overwrites sessionStorage if it exists
        if (data.title) setTitle(data.title);
        if (data.department) setDepartment(data.department);
        if (data.location) setLocation(data.location);
        if (data.experience) setExperience(data.experience);
        if (data.compensation) setCompensation(data.compensation);
        if (data.skills) setSkills(data.skills);
        if (data.description) setDescription(data.description);
        if (data.candidates && data.candidates.length > 0) {
          setCandidates(data.candidates);
          setHasSearched(true);
        }
      }
    };
    fetchOpportunity();
  }, []);

  // Load assessment data for this JD
  useEffect(() => {
    if (!opportunityId || !user?.id) return;
    const loadAssessment = async () => {
      const assessment = await hasAssessmentForJD(user.id, opportunityId);
      setExistingAssessment(assessment);
      if (assessment) {
        const scores = await getCompositeScoresForJD(opportunityId);
        const map = {};
        scores.forEach((s) => { map[s.studentId] = s; });
        setCompositeScores(map);
      }
    };
    loadAssessment();
  }, [opportunityId, user?.id]);

  // Save to sessionStorage + Supabase
  const syncToDb = async (updates: any) => {
    // Always save to sessionStorage (instant, survives navigation)
    try {
      const current = {
        title,
        department,
        location,
        experience,
        compensation,
        skills,
        description,
        candidates,
        savedAt: new Date().toISOString(),
      };
      // Merge updates into current
      const merged = { ...current, ...updates };
      if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {}

    // Also try Supabase
    if (opportunityId) {
      try {
        await supabase.from('opportunities').update(updates).eq('id', opportunityId);
      } catch (err) {
        console.error('Failed to sync to Supabase:', err);
      }
    }
  };

  // Clear saved opportunity
  const handleClearOpportunity = () => {
    if (!window.confirm('Clear the current opportunity and all shortlisted candidates?')) return;
    setTitle('');
    setDepartment('');
    setLocation('');
    setExperience('Intermediate (Year 3+)');
    setCompensation('');
    setSkills([]);
    setDescription('');
    setCandidates([]);
    setHasSearched(false);
    setOpportunityId(null);
    setFilterSkill('All');
    if (storageKey) sessionStorage.removeItem(storageKey);
    addToast('Opportunity cleared.', 'info');
  };

  // Add skill
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      if (skills.includes(newSkill.trim())) return;
      const updated = [...skills, newSkill.trim()];
      setSkills(updated);
      setNewSkill('');
      syncToDb({ skills: updated });
    }
  };

  const handleRemoveSkill = (tag: string) => {
    const updated = skills.filter((s) => s !== tag);
    setSkills(updated);
    syncToDb({ skills: updated });
  };

  // Search candidates using AI
  const handleSearch = async () => {
    if (!title.trim() || !description.trim()) {
      addToast('Please enter opportunity title and description.', 'info');
      return;
    }

    setIsSearching(true);
    setCandidates([]);

    try {
      const { data: resumes, error } = await supabase
        .from('resumes')
        .select('user_id, full_name, skills, cgpa, summary');

      if (error) throw error;

      if (!resumes || resumes.length === 0) {
        addToast('No student resumes found. Students need to upload resumes first.', 'info');
        setIsSearching(false);
        return;
      }

      const fullJD = [
        `Title: ${title}`,
        department && `Department: ${department}`,
        location && `Location: ${location}`,
        experience && `Experience: ${experience}`,
        compensation && `Compensation: ${compensation}`,
        skills.length > 0 && `Required Skills: ${skills.join(', ')}`,
        '',
        `Description:\n${description}`,
      ].filter(Boolean).join('\n');

      const ranked = await rankStudentsAgainstJD(fullJD, resumes);

      const matched: MatchedCandidate[] = ranked.map((r) => ({
        ...r,
        shortlisted: false,
      }));

      setCandidates(matched);
      setHasSearched(true);

      // Save everything to sessionStorage explicitly
      try {
        if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify({
          title,
          department,
          location,
          experience,
          compensation,
          skills,
          description,
          candidates: matched,
          savedAt: new Date().toISOString(),
        }));
      } catch {}

      syncToDb({
        title,
        department,
        location,
        experience,
        compensation,
        skills,
        description,
        candidates: matched,
      });

      addToast(`Found ${matched.length} matching candidates.`, 'success');
    } catch (err: any) {
      console.error('Search error:', err);
      addToast(`Search failed: ${err.message}`, 'info');
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle shortlist
  const toggleShortlist = (userId: string) => {
    const updated = candidates.map((c) =>
      c.user_id === userId ? { ...c, shortlisted: !c.shortlisted } : c
    );
    setCandidates(updated);
    syncToDb({ candidates: updated });

    const target = updated.find((c) => c.user_id === userId);
    if (target) {
      addToast(
        target.shortlisted ? `${target.full_name} shortlisted!` : `${target.full_name} removed from shortlist`,
        target.shortlisted ? 'success' : 'info'
      );
    }
  };

  // Message
  const handleMessageCandidate = (userId: string) => {
    navigate(`/messages?user_id=${userId}`);
  };

  const openMessageModal = (isBroadcast = false) => {
    setMsgTargetName('Top Matches');
    setMsgBroadcast(isBroadcast);
    setMsgText('');
    setIsMsgModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!msgText.trim()) return;
    addToast(
      msgBroadcast ? 'Broadcast sent to top matches!' : `Message sent to ${msgTargetName}!`,
      'success'
    );
    setIsMsgModalOpen(false);
  };

  // Assessment handlers
  const handleGenerateComplete = async () => {
    if (!user?.id || !opportunityId) return;
    const assessment = await hasAssessmentForJD(user.id, opportunityId);
    setExistingAssessment(assessment);
    addToast('Assessment generated successfully!', 'success');
  };

  const handleInviteStudent = (userId: string, name: string) => {
    setInviteModal({ open: true, studentUserId: userId, studentName: name });
  };

  // Filter & sort
  const allSkills = [...new Set(candidates.flatMap((c) => c.skills || []))];
  const filteredCandidates = candidates
    .filter((c) => filterSkill === 'All' || (c.skills || []).some((s) => s.toLowerCase() === filterSkill.toLowerCase()))
    .sort((a, b) => {
      if (sortByVerified) {
        const aScore = compositeScores[a.user_id]?.compositeScore ?? -1;
        const bScore = compositeScores[b.user_id]?.compositeScore ?? -1;
        return bScore - aScore;
      }
      return sortBy === 'match' ? b.matchScore - a.matchScore : b.cgpa - a.cgpa;
    });

  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;
  const avgCgpa = candidates.length > 0 ? (candidates.reduce((s, c) => s + c.cgpa, 0) / candidates.length).toFixed(1) : '0';

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold";
  const labelCls = "text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9E2A2B]" />
            <span>Opportunities Hub</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Post a role and find the best matching student candidates using AI.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-[#FDF2F2] text-[#9E2A2B] text-xs font-bold rounded-full border border-rose-100">
            Candidates: {candidates.length}
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
            Shortlisted: {shortlistedCount}
          </span>
          {hasSearched && existingAssessment && (
            <button
              onClick={() => setSortByVerified(!sortByVerified)}
              className={`px-3 py-1 text-xs font-bold rounded-full border cursor-pointer flex items-center gap-1 transition-all ${
                sortByVerified
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" /> {sortByVerified ? 'Verified Rank' : 'Sort: Resume'}
            </button>
          )}
          {hasSearched && (
            <button
              onClick={async () => {
                if (!opportunityId && title.trim()) {
                  try {
                    const fullJD = [
                      `Title: ${title}`,
                      department && `Department: ${department}`,
                      location && `Location: ${location}`,
                      experience && `Experience: ${experience}`,
                      compensation && `Compensation: ${compensation}`,
                      skills.length > 0 && `Required Skills: ${skills.join(', ')}`,
                      '',
                      `Description:\n${description}`,
                    ].filter(Boolean).join('\n');

                    const { data, error: insertErr } = await supabase
                      .from('opportunities')
                      .insert([{
                        title,
                        department,
                        location,
                        experience,
                        compensation,
                        skills,
                        description: fullJD,
                      }])
                      .select('id')
                      .single();
                    if (insertErr) throw insertErr;
                    if (data?.id) {
                      setOpportunityId(data.id);
                    } else {
                      throw new Error('No ID returned from insert.');
                    }
                  } catch (err: any) {
                    addToast(err.message || 'Failed to save opportunity. Please try again.', 'error');
                    return;
                  }
                }
                if (!opportunityId) {
                  addToast('No opportunity ID. Please search first.', 'error');
                  return;
                }
                setShowGenerateModal(true);
              }}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 cursor-pointer flex items-center gap-1 transition-all"
            >
              <ClipboardCheck className="w-3 h-3" /> {existingAssessment ? 'View Assessment' : 'Create Test'}
            </button>
          )}
          {hasSearched && (
            <button
              onClick={handleClearOpportunity}
              className="px-3 py-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-bold rounded-full border border-slate-200 hover:border-red-200 cursor-pointer flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Post an Opportunity</h3>
              <p className="text-xs text-slate-500 font-medium">Describe the role to find matching candidates.</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-[#9E2A2B] text-[10px] font-black rounded-md uppercase tracking-wider">
              AI-Powered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={labelCls}>Opportunity Title <span className="text-[#9E2A2B]">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Intern" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Department / Club</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. ACM Student Chapter" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, Campus" className={inputCls + " pl-10"} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Experience Level</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
                <option value="Beginner (Year 1-2)">Beginner (Year 1-2)</option>
                <option value="Intermediate (Year 3+)">Intermediate (Year 3+)</option>
                <option value="Advanced (Graduate)">Advanced (Graduate)</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelCls}>Compensation / Credit</label>
              <input type="text" value={compensation} onChange={(e) => setCompensation(e.target.value)} placeholder="e.g. Paid Stipend + Credit" className={inputCls} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelCls}>Required Skills</label>
              <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50/50 min-h-[46px]">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FDF2F2] border border-rose-100 text-[#9E2A2B] text-xs font-bold rounded-lg">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="hover:bg-rose-100 p-0.5 rounded-full cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Type skill + Enter..."
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-semibold text-slate-800 placeholder-slate-400 py-1 px-1"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelCls}>Detailed Description <span className="text-[#9E2A2B]">*</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls + " resize-none"} placeholder="Describe the role, responsibilities, and requirements..." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleSearch}
              disabled={isSearching || !title.trim() || !description.trim()}
              className="px-5 py-2.5 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="w-4 h-4" /> Find Matching Candidates</>
              )}
            </button>
          </div>
        </div>

        {/* Right: Insights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#9E2A2B]" /> Insights
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
              <div className="text-center border-r border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Avg CGPA</span>
                <span className="text-xl font-black text-slate-950 font-mono mt-1 block">{avgCgpa}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Shortlisted</span>
                <span className="text-xl font-black text-emerald-600 font-mono mt-1 block">{shortlistedCount}</span>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => openMessageModal(true)}
                disabled={candidates.length === 0}
                className="w-full py-2.5 bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message All Top 5
              </button>
            </div>
          </div>

          <div className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Pro Tip</h5>
              <p className="text-[11px] text-amber-700/80 leading-relaxed font-semibold">
                Add specific skills to get more accurate AI matching. The more detailed your description, the better the results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <Briefcase className="w-5 h-5 text-[#9E2A2B]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Top Matches</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  <span className="text-[#9E2A2B]">{filteredCandidates.length} candidates</span> matched
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 bg-white cursor-pointer"
              >
                <option value="All">All Skills</option>
                {allSkills.slice(0, 15).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 bg-white cursor-pointer"
              >
                <option value="match">Sort by Match</option>
                <option value="cgpa">Sort by CGPA</option>
              </select>
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">No matching candidates</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your requirements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((cand, index) => (
                <CandidateCard
                  key={cand.user_id}
                  candidate={cand}
                  rank={index}
                  compositeScore={compositeScores[cand.user_id]}
                  onToggleShortlist={() => toggleShortlist(cand.user_id)}
                  onMessage={() => handleMessageCandidate(cand.user_id)}
                  onSendTest={() => handleInviteStudent(cand.user_id, cand.full_name)}
                  hasAssessment={!!existingAssessment}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                {msgBroadcast ? 'Broadcast to Top Matches' : `Message ${msgTargetName}`}
              </h3>
              <button onClick={() => setIsMsgModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-[#9E2A2B] resize-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsMsgModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleSendMessage} disabled={!msgText.trim()} className="px-4 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl hover:bg-[#802223] cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Modals */}
      <GenerateAssessmentModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        jdId={opportunityId || ''}
        jdText={description}
        jdTitle={title}
        onGenerated={handleGenerateComplete}
      />
      <InviteStudentModal
        isOpen={inviteModal.open}
        onClose={() => setInviteModal({ open: false, studentUserId: '', studentName: '' })}
        assessmentId={existingAssessment?.id || ''}
        studentUserId={inviteModal.studentUserId}
        studentName={inviteModal.studentName}
        onInvited={() => addToast('Test invitation sent!', 'success')}
      />
    </div>
  );
}

function CandidateCard({ candidate, rank, compositeScore, onToggleShortlist, onMessage, onSendTest, hasAssessment }: {
  candidate: MatchedCandidate;
  rank: number;
  compositeScore?: { verifiedTestScore: number | null; compositeScore: number | null; verifiedStatus: boolean };
  onToggleShortlist: () => void;
  onMessage: () => void;
  onSendTest: () => void;
  hasAssessment: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const getRankIcon = (i: number) => {
    if (i === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (i === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (i === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-[11px] font-black text-slate-400">#{i + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-[#9E2A2B] bg-[#FDF2F2] border-rose-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${candidate.shortlisted ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
      <div className="flex items-center gap-4">
        <div className="shrink-0">{getRankIcon(rank)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h5 className="text-sm font-extrabold text-slate-900 truncate">{candidate.full_name}</h5>
            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${getScoreColor(candidate.matchScore)}`}>
              {candidate.matchScore}% Match
            </span>
            {compositeScore?.verifiedStatus && compositeScore.compositeScore != null && (
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                Verified: {Math.round(compositeScore.compositeScore)}%
              </span>
            )}
            {!compositeScore?.verifiedStatus && hasAssessment && (
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full border bg-slate-50 text-slate-500 border-slate-200">
                Unverified (Test Pending)
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-400">CGPA: {candidate.cgpa.toFixed(1)}</span>
          </div>
          {candidate.summary && (
            <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-1">{candidate.summary}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {(candidate.matched_skills || []).slice(0, 5).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-100">{skill}</span>
            ))}
            {(candidate.matched_skills || []).length > 5 && (
              <span className="px-2 py-0.5 text-[9px] font-bold text-slate-400">+{(candidate.matched_skills || []).length - 5}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAssessment && (
            <button onClick={onSendTest} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all cursor-pointer border border-indigo-100" title="Send Verification Test">
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleShortlist}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
              candidate.shortlisted
                ? 'bg-amber-100 border-amber-200 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {candidate.shortlisted ? '★ Shortlisted' : 'Shortlist'}
          </button>
          <button onClick={onMessage} className="p-1.5 rounded-lg bg-[#FDF2F2] hover:bg-[#9E2A2B] text-[#9E2A2B] hover:text-white transition-all cursor-pointer">
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-9 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h6 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Matched Skills</h6>
              <div className="flex flex-wrap gap-1">
                {(candidate.matched_skills || []).length > 0 ? (
                  (candidate.matched_skills || []).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">{skill}</span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No skills matched</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <h6 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Missing from JD</h6>
              <div className="flex flex-wrap gap-1">
                {(candidate.unmatched_jd_skills || []).length > 0 ? (
                  (candidate.unmatched_jd_skills || []).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">{skill}</span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">All skills covered</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
