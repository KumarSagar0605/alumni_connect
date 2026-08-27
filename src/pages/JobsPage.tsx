import { useState } from 'react';
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
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Wrench,
  FileText,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { rankStudentsAgainstJD, type RankedStudent } from '../services/geminiService';

const skillSuggestions = [
  'React', 'TypeScript', 'Python', 'Java', 'Node.js', 'SQL', 'AWS',
  'Machine Learning', 'Docker', 'Git', 'Figma', 'PostgreSQL', 'MongoDB',
  'GraphQL', 'REST APIs', 'CSS', 'Tailwind', 'Next.js', 'Go', 'Rust',
];

export default function JobsPage() {
  const { addToast } = useApp();

  const [vacancyName, setVacancyName] = useState('');
  const [department, setDepartment] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [compensation, setCompensation] = useState('');
  const [commitment, setCommitment] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [rankings, setRankings] = useState<RankedStudent[]>([]);
  const [showResults, setShowResults] = useState(false);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skillsRequired.includes(trimmed)) {
      setSkillsRequired([...skillsRequired, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkillsRequired(skillsRequired.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleFindCandidates = async () => {
    if (!vacancyName.trim() || !jobDescription.trim()) {
      addToast('Please enter job title and description.', 'info');
      return;
    }

    setAnalyzing(true);
    setRankings([]);
    setShowResults(false);

    try {
      const { data: resumes, error: resumeError } = await supabase
        .from('resumes')
        .select('user_id, full_name, skills, cgpa, summary, projects, experience');

      if (resumeError) throw resumeError;

      if (!resumes || resumes.length === 0) {
        addToast('No student resumes found in the system yet. Students need to upload resumes first.', 'info');
        setAnalyzing(false);
        return;
      }

      const fullJD = [
        `Job Title: ${vacancyName}`,
        department && `Department: ${department}`,
        location && `Location: ${location}`,
        compensation && `Compensation: ${compensation}`,
        commitment && `Commitment: ${commitment}`,
        experience && `Experience Required: ${experience}`,
        skillsRequired.length > 0 && `Skills Required: ${skillsRequired.join(', ')}`,
        '',
        `Job Description:\n${jobDescription}`,
      ].filter(Boolean).join('\n');

      const ranked = await rankStudentsAgainstJD(fullJD, resumes);
      const top5 = ranked.slice(0, 5);
      setRankings(top5);
      setShowResults(true);
      addToast(`Found top ${top5.length} candidates out of ${resumes.length} resumes.`, 'success');
    } catch (err: any) {
      console.error('Analysis error:', err);
      addToast(`Analysis failed: ${err.message}`, 'info');
    } finally {
      setAnalyzing(false);
    }
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

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:bg-white focus:border-[#9E2A2B]/40 focus:ring-2 focus:ring-[#9E2A2B]/10 text-xs font-semibold placeholder-slate-400";
  const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Find Top Candidates</h1>
        <p className="text-xs text-slate-500 font-medium">
          Enter your job vacancy details and our AI will rank the top 5 student candidates from the pool.
        </p>
      </div>

      {/* Job Vacancy Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Job Vacancy Details</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Fill in the vacancy information to find matching candidates</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Row 1: Title + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vacancy Name <span className="text-[#9E2A2B] font-bold">*</span></label>
              <input
                type="text"
                value={vacancyName}
                onChange={(e) => setVacancyName(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering, Design, Marketing"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 2: Location + Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote, Bangalore, On-campus"
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Compensation</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="e.g. ₹8-12 LPA, Unpaid, Stipend"
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Experience + Commitment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Experience Required</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 0-2 years, Freshers, 3+ years"
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Commitment Type</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                  placeholder="e.g. Full-time, Part-time, Internship"
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className={labelCls}>Skills Required</label>
            <div className="relative">
              <Wrench className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter..."
                className={inputCls + " pl-9"}
              />
            </div>
            {skillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skillsRequired.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FDF2F2] border border-rose-100 text-[#9E2A2B] text-[10px] font-bold rounded-lg">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-rose-800 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {skillSuggestions.filter((s) => !skillsRequired.includes(s)).slice(0, 10).map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold rounded-md transition-colors cursor-pointer"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className={labelCls}>Job Description <span className="text-[#9E2A2B] font-bold">*</span></label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Describe the role, responsibilities, required qualifications, and what a typical day looks like..."
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Find Button */}
          <div className="pt-2">
            <button
              onClick={handleFindCandidates}
              disabled={analyzing || !vacancyName.trim() || !jobDescription.trim()}
              className="px-6 py-3 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is Analyzing Candidates...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Top 5 Candidates
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary Card */}
      {showResults && rankings.length > 0 && (
        <div className="bg-gradient-to-r from-[#9E2A2B] to-[#C0392B] rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold">Top {rankings.length} Candidates Found</h3>
              <p className="text-rose-200 text-xs font-semibold">
                For <span className="text-white font-bold">{vacancyName}</span>
                {department && <> in <span className="text-white font-bold">{department}</span></>}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
          </div>
        </div>
      )}

      {/* Ranked Candidates */}
      {showResults && rankings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9E2A2B]" />
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Ranked Candidates</h4>
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

      {showResults && rankings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">No matching candidates found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting the job requirements or skills</p>
        </div>
      )}

      {!showResults && !analyzing && (
        <div className="text-center py-12">
          <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">Fill in the job vacancy details above</p>
          <p className="text-[11px] text-slate-300 mt-1">Our AI will match and rank the best student candidates</p>
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
          <div className="flex items-center gap-3 flex-wrap">
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
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 ml-9 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h6 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Matched Skills</h6>
              <div className="flex flex-wrap gap-1">
                {student.matched_skills.length > 0 ? (
                  student.matched_skills.map((skill, i) => (
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
                {student.unmatched_jd_skills.length > 0 ? (
                  student.unmatched_jd_skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">{skill}</span>
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
