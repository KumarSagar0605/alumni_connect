import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Sparkles,
  Plus,
  X,
  MessageSquare,
  Download,
  ExternalLink,
  Lock,
  Check,
  ChevronDown,
  SlidersHorizontal,
  Award,
  FileText,
  Lightbulb,
  Send,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

import { supabase } from '../supabaseClient';

interface Candidate {
  id: string;
  name: string;
  role: string;
  year: string;
  department: string;
  avatar: string;
  semester: number;
  cgpa: number;
  matchScore: number;
  quote: string;
  skills: string[];
  resumeName: string;
  resumeSize: string;
  resumeDesc: string;
  email: string;
  phone: string;
  availability: string;
  activeProjects: number;
  completedTasks: number;
  hasPortfolio?: boolean;
  privacyLocked?: boolean;
  shortlisted?: boolean;
}

interface OpportunitiesProps {
  onAddToast?: (message: string, type?: 'success' | 'info') => void;
}

export default function Opportunities({ onAddToast }: OpportunitiesProps) {
  const navigate = useNavigate();
  const showToast = onAddToast || (() => {});
  // Form State
  const [title, setTitle] = useState('Frontend Intern — Campus AR Tour');
  const [department, setDepartment] = useState('ACM Student Chapter');
  const [location, setLocation] = useState('Campus Hub (Room 402)');
  const [experience, setExperience] = useState('Intermediate (Year 3+)');
  const [compensation, setCompensation] = useState('Stipend + Course Credit');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'UX Design']);
  const [newSkill, setNewSkill] = useState('');
  const [description, setDescription] = useState(
    'We are building an augmented reality tour of the Atria campus. Looking for a frontend intern who is passionate about building seamless user interfaces and has a strong grasp of React hooks and performance optimization...'
  );
  const [opportunityId, setOpportunityId] = useState<string | null>(null);

  // Load Opportunities fields & candidates from Express database on mount
 useEffect(() => {
    const fetchOpportunities = async () => {
      const { data, error } = await supabase.from('opportunities').select('*').limit(1).single();
      
      if (data) {
        setOpportunityId(data.id);
        if (data.title !== 'Initial Opportunity') {
          if (data.title) setTitle(data.title);
          if (data.department) setDepartment(data.department);
          if (data.location) setLocation(data.location);
          if (data.experience) setExperience(data.experience);
          if (data.compensation) setCompensation(data.compensation);
          if (data.skills) setSkills(data.skills);
          if (data.description) setDescription(data.description);
          if (data.candidates) setCandidates(data.candidates);
        }
      }
    };
    fetchOpportunities();
  }, []);

  const syncOpportunitiesToDb = async (updatedFields: any) => {
    if (!opportunityId) return;
    try {
      await supabase.from('opportunities').update(updatedFields).eq('id', opportunityId);
    } catch (err) {
      console.error('Failed to save opportunities to db:', err);
    }
  };

  // Search/Processing States
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'cgpa'>('match');
  const [filterSkill, setFilterSkill] = useState('All');

  // Interactive Message Modal States
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgTargetName, setMsgTargetName] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgBroadcast, setMsgBroadcast] = useState(false);

  // Candidate Data State
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 'cand-1',
      name: 'Priya Rao',
      role: 'Senior (4th Year)',
      year: 'Senior (4th Year)',
      department: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      semester: 8,
      cgpa: 9.2,
      matchScore: 98,
      quote: 'Aspiring Frontend Engineer with 2 internships focused on React and accessible UX design.',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'UX Design'],
      resumeName: 'priya_rao_frontend_dev.pdf',
      resumeSize: '1.2 MB',
      resumeDesc: 'Passionate developer with experience in building responsive UI',
      email: 'priya.rao@atria.edu',
      phone: '+91 98450 12345',
      availability: 'Immediate',
      activeProjects: 12,
      completedTasks: 24,
      shortlisted: true
    },
    {
      id: 'cand-2',
      name: 'Jamal Reed',
      role: 'Junior (3rd Year)',
      year: 'Junior (3rd Year)',
      department: 'Information Technology',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
      semester: 6,
      cgpa: 8.7,
      matchScore: 92,
      quote: 'Full-stack enthusiast with a focus on Node.js backends and clean architectural patterns.',
      skills: ['Node.js', 'PostgreSQL', 'React', 'TypeScript'],
      resumeName: 'jamal_reed_cv_2024.pdf',
      resumeSize: '1.2 MB',
      resumeDesc: 'Experienced in developing RESTful APIs and managing database services',
      email: 'jamal.reed@atria.edu',
      phone: '+91 98450 67890',
      availability: '2 weeks',
      activeProjects: 8,
      completedTasks: 15,
      shortlisted: true
    },
    {
      id: 'cand-3',
      name: 'Ananya Sharma',
      role: 'Sophomore (2nd Year)',
      year: 'Sophomore (2nd Year)',
      department: 'Design & Visual Arts',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      semester: 4,
      cgpa: 9.5,
      matchScore: 89,
      quote: 'Product Designer focused on user research and high-fidelity prototyping in Figma.',
      skills: ['Figma', 'User Research', 'Prototyping', 'UX Design'],
      resumeName: 'ananya_sharma_portfolio.pdf',
      resumeSize: '1.2 MB',
      resumeDesc: 'Visual storyteller dedicated to creating intuitive user flows',
      email: 'ananya.s@atria.edu',
      phone: '+91 98450 11223',
      availability: 'Immediate',
      activeProjects: 15,
      completedTasks: 32,
      hasPortfolio: true,
      shortlisted: false
    },
    {
      id: 'cand-4',
      name: 'Kevin Zhang',
      role: 'Senior (4th Year)',
      year: 'Senior (4th Year)',
      department: 'Software Engineering',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      semester: 7,
      cgpa: 8.1,
      matchScore: 84,
      quote: 'Specialist in cloud infrastructure and DevOps practices using AWS and Docker.',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Node.js'],
      resumeName: 'kevin_zhang_devops.pdf',
      resumeSize: '1.2 MB',
      resumeDesc: 'Cloud-native developer with a passion for automation, CI/CD pipelines',
      email: 'k.zhang@atria.edu',
      phone: 'Restricted',
      availability: 'Immediate',
      activeProjects: 6,
      completedTasks: 11,
      privacyLocked: true,
      shortlisted: false
    },
    {
      id: 'cand-5',
      name: 'Sofia Martinez',
      role: 'Junior (3rd Year)',
      year: 'Junior (3rd Year)',
      department: 'Business Analytics',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      semester: 5,
      cgpa: 8.9,
      matchScore: 81,
      quote: 'Data analyst proficient in Python and Tableau with a keen eye for business intelligence.',
      skills: ['Python', 'Tableau', 'SQL', 'React'],
      resumeName: 'sofia_m_analytics.pdf',
      resumeSize: '1.2 MB',
      resumeDesc: 'Analytical thinker experienced in transforming complex datasets into insights',
      email: 'sofia.martinez@atria.edu',
      phone: '+91 98450 55667',
      availability: '1 month',
      activeProjects: 4,
      completedTasks: 9,
      shortlisted: false
    }
  ]);

  // Dynamically calculate skill coverage based on matching required skills
  const getSkillCoverage = () => {
    const coverage: Record<string, number> = {
      React: 0,
      TypeScript: 0,
      'Node.js': 0,
      Figma: 0,
      Python: 0
    };

    // Count how many candidates have these popular skills
    candidates.forEach((cand) => {
      cand.skills.forEach((skill) => {
        if (skill in coverage) {
          coverage[skill] += 1;
        }
      });
    });

    // Map to percentage based on top 5
    return Object.entries(coverage).map(([name, count]) => ({
      name,
      percentage: (count / 5) * 100
    }));
  };

  // Trigger search simulation when clicking "Proceed & Search Candidates"
  const handleProceedSearch = () => {
    setIsSearching(true);
    showToast('Analyzing skills & matching student database in real-time...', 'info');

    setTimeout(() => {
      // Recalculate match scores based on the current list of skills in the state
      const updatedCandidates = candidates.map((cand) => {
        // Find how many of the entered skills match the candidate's skills
        const matchingSkills = cand.skills.filter((s) =>
          skills.some((req) => req.toLowerCase() === s.toLowerCase())
        );

        // Simple math score: base of 50% + 15% per matching skill, max 99
        let score = 50 + matchingSkills.length * 15;
        if (score > 99) score = 99;
        if (matchingSkills.length === 0) score = Math.max(30, score - 25);

        return {
          ...cand,
          matchScore: score
        };
      });

      // Sort according to current sortBy option
      const sorted = [...updatedCandidates].sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore;
        } else {
          return b.cgpa - a.cgpa;
        }
      });

      setCandidates(sorted);
      setIsSearching(false);

      // Persist new state to backend Express database
      syncOpportunitiesToDb({
        title,
        department,
        location,
        experience,
        compensation,
        skills,
        description,
        candidates: sorted
      });

      showToast('Top matching student profiles updated and sorted!', 'success');
    }, 1200);
  };

  // Add a required skill tag
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      if (skills.includes(newSkill.trim())) {
        showToast('Skill already added', 'info');
        return;
      }
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill('');
      syncOpportunitiesToDb({ skills: updatedSkills });
    }
  };

  // Remove a required skill tag
  const handleRemoveSkill = (tag: string) => {
    const updatedSkills = skills.filter((s) => s !== tag);
    setSkills(updatedSkills);
    syncOpportunitiesToDb({ skills: updatedSkills });
  };

  // Toggle shortlist status for a candidate in database
  const toggleShortlist = async (candId: string) => {
    // 1. Update local state first for immediate UI feedback
    const updatedCandidates = candidates.map(c => 
      c.id === candId ? { ...c, shortlisted: !c.shortlisted } : c
    );
    
    setCandidates(updatedCandidates);
    
    const target = updatedCandidates.find((c) => c.id === candId);
    if (target) {
      showToast(
        target.shortlisted
          ? `${target.name} has been added to your shortlist!`
          : `${target.name} removed from your shortlist`,
        target.shortlisted ? 'success' : 'info'
      );
    }

    // 2. Sync the new array to Supabase
    if (opportunityId) {
      await supabase.from('opportunities').update({ candidates: updatedCandidates }).eq('id', opportunityId);
    }
  };

  // Open Message Modal
  const openMessageModal = (name: string, isBroadcast = false) => {
    setMsgTargetName(name);
    setMsgBroadcast(isBroadcast);
    setMsgText('');
    setIsMsgModalOpen(true);
  };

  // Send message mock
  const handleSendMessage = () => {
    if (!msgText.trim()) return;

    if (msgBroadcast) {
      showToast(`Broadcast message successfully queued to top matches!`, 'success');
    } else {
      showToast(`Message sent to ${msgTargetName}!`, 'success');
    }

    setIsMsgModalOpen(false);
  };

  // Filter and sort candidates
  const filteredCandidates = candidates
    .filter((cand) => {
      if (filterSkill === 'All') return true;
      return cand.skills.some((s) => s.toLowerCase() === filterSkill.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'match') {
        return b.matchScore - a.matchScore;
      } else {
        return b.cgpa - a.cgpa;
      }
    });

  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;

  return (
    <div className="space-y-8 animate-fade-in" id="opportunities-view-container">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9E2A2B]" />
            <span>Opportunities Hub & Matchmaking</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Publish custom criteria and automatically map real-time candidates within Atria.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[#FDF2F2] text-[#9E2A2B] text-xs font-bold rounded-full border border-rose-100">
            Active Candidates: 5
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
            Shortlisted: {shortlistedCount}
          </span>
        </div>
      </div>

      {/* TOP PORTION: TWO-COLUMN FORM AND INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: OPPORTUNITY CREATOR FORM */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6 relative">
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Post an Opportunity</h3>
              <p className="text-xs text-slate-500 font-medium">
                Describe the role to find high-matching student candidates in seconds.
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-[#9E2A2B] text-[10px] font-black rounded-md uppercase tracking-wider">
              Step 1 of 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Opportunity Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Frontend Intern"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold"
              />
            </div>

            {/* Department / Club */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Department / Club
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. ACM Student Chapter"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 402 or Remote"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold"
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Experience Level
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold appearance-none cursor-pointer"
              >
                <option value="Beginner (Year 1-2)">Beginner (Year 1-2)</option>
                <option value="Intermediate (Year 3+)">Intermediate (Year 3+)</option>
                <option value="Advanced (Graduate)">Advanced (Graduate)</option>
              </select>
            </div>

            {/* Compensation / Credit */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Compensation / Credit
              </label>
              <input
                type="text"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder="e.g. Paid Stipend + Credit"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold"
              />
            </div>

            {/* Required Skills Tags */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Required Skills & Keywords
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50/50 min-h-[46px]">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FDF2F2] border border-rose-100 text-[#9E2A2B] text-xs font-bold rounded-lg"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:bg-rose-100 p-0.5 rounded-full text-[#9E2A2B]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Add skill..."
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:ring-0 text-xs font-semibold text-slate-800 placeholder-slate-400 py-1 px-1"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold italic">
                Press Enter to add skills. Changes will update candidate matchmaking scores.
              </p>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Detailed Role Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold resize-none"
              />
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle className="w-4 h-4 text-slate-400 animate-pulse" />
              <span className="text-[11px] font-bold">Matches are updated in real-time based on your keywords.</span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => showToast('Draft details saved successfully!', 'success')}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Save Draft
              </button>
              
              <button
                onClick={handleProceedSearch}
                disabled={isSearching}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed & Search Candidates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CANDIDATE INSIGHTS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* INSIGHTS SUMMARY CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-[#9E2A2B]" />
                <span>Candidate Insights</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Aggregate data of top 5 matches</p>
            </div>

            {/* Skill coverage progress indicators */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Skill Coverage</span>
              <div className="space-y-2.5">
                {getSkillCoverage().map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-[#9E2A2B] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Microstats block */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-150 p-3.5 rounded-xl">
              <div className="text-center border-r border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Avg CGPA</span>
                <span className="text-xl font-black text-slate-950 font-mono mt-1 block">9.08</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Shortlisted</span>
                <span className="text-xl font-black text-emerald-600 font-mono mt-1 block">{shortlistedCount}</span>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => openMessageModal('Top Matches', true)}
                className="w-full py-2.5 bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message All Top 5</span>
              </button>
              
              <button
                onClick={() => showToast('Candidate database successfully compiled and exported as spreadsheet!', 'success')}
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Candidates</span>
              </button>
            </div>
          </div>

          {/* PRO TIP WIDGET */}
          <div className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-5 shadow-3xs flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
              <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Pro Tip</h5>
              <p className="text-[11px] text-amber-700/80 leading-relaxed font-semibold">
                Candidates with a "Portfolio" badge have linked their external project showcases, which often indicates higher engagement and technical preparedness.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* LOWER FEED: MATCHED STUDENTS CONTAINER */}
      <div className="space-y-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        
        {/* TOP BAR / CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
              <Briefcase className="w-5 h-5 text-[#9E2A2B]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sans">
                Top Candidate Matches
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                Found <span className="text-[#9E2A2B]">{filteredCandidates.length} excellent matches</span> for your &ldquo;Frontend Intern&rdquo; role.
              </p>
            </div>
          </div>

          {/* Sorter and filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Filter by core skill */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">Skill:</span>
              <select
                value={filterSkill}
                onChange={(e) => {
                  setFilterSkill(e.target.value);
                  showToast(`Filtering candidates by: ${e.target.value}`, 'info');
                }}
                className="bg-slate-50/80 border border-slate-200 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#9E2A2B] cursor-pointer"
              >
                <option value="All">All Skills</option>
                <option value="React">React</option>
                <option value="TypeScript">TypeScript</option>
                <option value="UX Design">UX Design</option>
                <option value="Figma">Figma</option>
                <option value="Python">Python</option>
              </select>
            </div>

            {/* Sorting criteria */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">Sort:</span>
              <button
                onClick={() => {
                  const target = sortBy === 'match' ? 'cgpa' : 'match';
                  setSortBy(target);
                  showToast(`Sorting matches by ${target === 'match' ? 'Match Score' : 'CGPA'}`, 'info');
                }}
                className="bg-slate-50/80 border border-slate-200 text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>{sortBy === 'match' ? 'Match Score' : 'CGPA'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CANDIDATES LIST BOX */}
        <div className="divide-y divide-slate-100">
          {filteredCandidates.map((cand) => (
            <div
              key={cand.id}
              className="py-6 flex flex-col lg:flex-row items-start justify-between gap-6 first:pt-0 last:pb-0"
            >
              {/* Profile Details Frame */}
              <div className="flex flex-col sm:flex-row gap-5 items-start flex-1 min-w-0">
                {/* Custom Avatar with Circle Progress for Match score */}
                <div className="relative shrink-0">
                  <img
                    src={cand.avatar}
                    alt={cand.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  {/* Matching percentage ring */}
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white flex items-center justify-center font-mono">
                    {cand.matchScore}%
                  </div>
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      <span>{cand.name}</span>
                      {cand.hasPortfolio && (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-200/50 text-amber-700 text-[9px] font-black rounded-sm uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>Portfolio</span>
                        </span>
                      )}
                    </h5>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-xs text-slate-400 font-bold">{cand.year} • {cand.department}</span>
                  </div>

                  {/* Micro Grid metrics */}
                  <div className="flex items-center gap-6 text-[11px] font-bold text-slate-600 font-mono bg-slate-50/50 p-2 rounded-lg border border-slate-100/60 w-fit">
                    <div>
                      <span className="text-slate-400 uppercase mr-1">Semester</span>
                      <span className="text-slate-800">{cand.semester}</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200" />
                    <div>
                      <span className="text-slate-400 uppercase mr-1">CGPA</span>
                      <span className="text-slate-800">{cand.cgpa}/10</span>
                    </div>
                  </div>

                  {/* Quote block */}
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold italic max-w-2xl bg-rose-50/20 border-l-2 border-rose-100/70 py-1.5 pl-3">
                    &ldquo;{cand.quote}&rdquo;
                  </p>

                  {/* Tech/Skill Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {cand.skills.map((skill) => {
                      const isRequired = skills.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`text-[10px] px-2.5 py-0.5 font-bold rounded-md transition-colors ${
                            isRequired
                              ? 'bg-rose-50 border border-rose-100 text-[#9E2A2B]'
                              : 'bg-slate-100 border border-slate-200 text-slate-500'
                          }`}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>

                  {/* ATTACHED RESUME ROW CARD */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4 max-w-xl shadow-3xs group/res hover:border-[#9E2A2B]/40 transition-all cursor-pointer" onClick={() => showToast(`Opened resume document: ${cand.resumeName}`, 'info')}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
                        <FileText className="w-4 h-4 text-[#9E2A2B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h6 className="text-xs font-extrabold text-slate-800 leading-none truncate group-hover/res:text-[#9E2A2B] transition-colors">{cand.resumeName}</h6>
                          <span className="text-[9px] text-slate-400 font-semibold">{cand.resumeSize}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug font-medium truncate max-w-[300px] mt-0.5">{cand.resumeDesc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Initiated preview for ${cand.name}'s CV`, 'info');
                        }}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                        title="View Resume"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Downloading ${cand.resumeName}...`, 'success');
                        }}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                        title="Download Resume"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Footnote Contact Info row */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-[10px] font-bold text-slate-400 font-mono uppercase">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-300" />
                      <span>{cand.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-300" />
                      <span>{cand.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      <span>Availability: {cand.availability}</span>
                    </div>
                  </div>

                  {cand.privacyLocked && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-fit">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Privacy Locked. Some details restricted by student privacy settings.
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Action Buttons column on Right */}
              <div className="flex lg:flex-col items-center gap-2.5 w-full lg:w-36 shrink-0 lg:border-l lg:border-slate-100 lg:pl-6 pt-4 lg:pt-0">
                <button
                  onClick={() => openMessageModal(cand.name)}
                  className="flex-1 lg:flex-none w-full py-2 bg-[#9E2A2B] hover:bg-[#802223] text-white text-xs font-bold rounded-xl shadow-3xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
                
                <button
                  onClick={() => showToast(`Redirecting to complete portfolio of ${cand.name}...`, 'info')}
                  className="flex-1 lg:flex-none w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                >
                  View Profile
                </button>
                
                <button
                  onClick={() => toggleShortlist(cand.id)}
                  className={`flex-1 lg:flex-none w-full py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center flex items-center justify-center gap-1 ${
                    cand.shortlisted
                      ? 'bg-rose-50 border-rose-100 text-[#9E2A2B] hover:bg-rose-100/50'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {cand.shortlisted ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Shortlisted</span>
                    </>
                  ) : (
                    <span>Shortlist</span>
                  )}
                </button>
              </div>

            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="py-12 text-center text-slate-500 font-bold text-xs uppercase tracking-wider space-y-2">
              <p>No candidates match the selected skill filter.</p>
              <button
                onClick={() => setFilterSkill('All')}
                className="text-[#9E2A2B] hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM PAGINATION AT LAST */}
        <div className="flex justify-center pt-6 border-t border-slate-100">
          <button
            onClick={() => showToast('Scanning archive database... No more matching students found in this tier.', 'info')}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Show more results</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

      </div>

      {/* QUICK COMMUNICATOR MODAL */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-150 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest block">
                  {msgBroadcast ? 'BROADCAST BULK MAIL' : 'DIRECT COMMUNICATOR'}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  {msgBroadcast ? 'Message All Top 5 Candidates' : `Message: ${msgTargetName}`}
                </h4>
              </div>
              <button
                onClick={() => setIsMsgModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Select Template
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setMsgText(`Hi! We reviewed your profile and think you'd be a perfect fit for the Frontend Intern role at ACM. Let's schedule a chat!`)}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-[#FDF2F2] hover:text-[#9E2A2B] font-bold rounded-md transition-colors"
                  >
                    Invitation to Interview
                  </button>
                  <button
                    onClick={() => setMsgText(`Congratulations! You have been shortlisted for the Frontend Intern position. Please send us your availability for this week.`)}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-[#FDF2F2] hover:text-[#9E2A2B] font-bold rounded-md transition-colors"
                  >
                    Shortlist Update
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Compose Message
                </label>
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Type your outreach message here..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsMsgModalOpen(false)}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!msgText.trim()}
                className="flex-1 py-2 bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send outreach</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
