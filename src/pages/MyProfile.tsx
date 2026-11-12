import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
import {
  User,
  Mail,
  Linkedin,
  Github,
  Award,
  BookOpen,
  Code,
  GraduationCap,
  Edit2,
  Check,
  MessageSquare,
  ExternalLink,
  MapPin,
  X,
  Loader2,
  FileText,
  Upload,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import RoleManager from '../components/RoleManager';

interface ProfileData {
  id?: string;
  user_id: string;
  full_name: string;
  bio: string;
  skills: string[];
  education: {
    degree: string;
    school: string;
    years: string;
    details: string;
  };
  contact: {
    email: string;
    linkedin: string;
    github: string;
  };
  projects: {
    name: string;
    desc: string;
    tags: string[];
    type: 'code' | 'other';
  }[];
  avatar_url: string;
  role: string;
}

interface ProjectItem {
  name: string;
  desc: string;
  tags: string[];
  type: 'code' | 'other';
}

export default function MyProfile() {
  const { user, userRole } = useAuth();
  const { addToast: onAddToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [parsingResume, setParsingResume] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [resumeExperience, setResumeExperience] = useState<any[]>([]);
  const [resumeEducation, setResumeEducation] = useState<any[]>([]);
  const [resumeProjects, setResumeProjects] = useState<any[]>([]);
  const [resumeCgpa, setResumeCgpa] = useState(0);
  const [resumeCertifications, setResumeCertifications] = useState<string[]>([]);
  const [resumeSummary, setResumeSummary] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [education, setEducation] = useState({ degree: '', school: '', years: '', details: '' });
  const [contact, setContact] = useState({ email: '', linkedin: '', github: '' });
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('Student');

  const [tempFullName, setTempFullName] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [tempDegree, setTempDegree] = useState('');
  const [tempSchool, setTempSchool] = useState('');
  const [tempYears, setTempYears] = useState('');
  const [tempDetails, setTempDetails] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempLinkedin, setTempLinkedin] = useState('');
  const [tempGithub, setTempGithub] = useState('');
  const [tempProjects, setTempProjects] = useState<ProjectItem[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [newProjectType, setNewProjectType] = useState<'code' | 'other'>('code');

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfileId(data.id);
          setFullName(data.full_name || '');
          setBio(data.bio || '');
          setSkills(data.skills || []);
          setEducation(data.education || { degree: '', school: '', years: '', details: '' });
          setContact(data.contact || { email: '', linkedin: '', github: '' });
          setProjects(data.projects || []);
          setAvatarUrl(data.avatar_url || '');
          setRole(data.role || 'Student');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Check if student has a resume
    if (userRole === 'student') {
      supabase
        .from('resumes')
        .select('id, file_name, skills, experience, education, cgpa, projects, certifications, summary')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setHasResume(true);
            setResumeFileName(data.file_name || '');
            setResumeSkills(data.skills || []);
            setResumeExperience(data.experience || []);
            setResumeEducation(data.education || []);
            setResumeProjects(data.projects || []);
            setResumeCgpa(data.cgpa || 0);
            setResumeCertifications(data.certifications || []);
            setResumeSummary(data.summary || '');
          }
        })
        .catch(() => {});
    }
  }, [user, userRole]);

  const handleStartEdit = () => {
    setTempFullName(fullName);
    setTempBio(bio);
    setTempDegree(education.degree);
    setTempSchool(education.school);
    setTempYears(education.years);
    setTempDetails(education.details);
    setTempEmail(contact.email);
    setTempLinkedin(contact.linkedin);
    setTempGithub(contact.github);
    setTempProjects([...projects]);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const updatedProfile = {
      full_name: tempFullName,
      bio: tempBio,
      education: {
        degree: tempDegree,
        school: tempSchool,
        years: tempYears,
        details: tempDetails,
      },
      contact: {
        email: tempEmail,
        linkedin: tempLinkedin,
        github: tempGithub,
      },
      projects: tempProjects,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.auth.updateUser({ data: { full_name: updatedProfile.full_name } });

      setFullName(updatedProfile.full_name);
      setBio(updatedProfile.bio);
      setEducation(updatedProfile.education);
      setContact(updatedProfile.contact);
      setProjects(updatedProfile.projects);
      setIsEditing(false);
      onAddToast('Profile saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving profile:', err);
      onAddToast('Failed to save profile. Please try again.', 'info');
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      setTempProjects([...tempProjects, {
        name: newProjectName.trim(),
        desc: newProjectDesc.trim(),
        tags: newProjectTags.split(',').map(t => t.trim()).filter(Boolean),
        type: newProjectType,
      }]);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectTags('');
      setNewProjectType('code');
    }
  };

  const handleRemoveProject = (idx: number) => {
    setTempProjects(tempProjects.filter((_, i) => i !== idx));
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      onAddToast('Please upload a PDF file.', 'info');
      return;
    }

    setParsingResume(true);
    try {
      // Dynamic import to avoid bundling pdf.js unless needed

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let rawText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        rawText += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      rawText = rawText.replace(/\u0000/g, '');

      // Parse with Gemini
      const { parseResumeWithAI } = await import('../services/geminiService');
      const parsed = await parseResumeWithAI(rawText);

      const s = (v: any): any => {
        if (typeof v === 'string') return v.replace(/\u0000/g, '');
        if (Array.isArray(v)) return v.map(s);
        if (v && typeof v === 'object') {
          const o: any = {};
          for (const k of Object.keys(v)) o[k] = s(v[k]);
          return o;
        }
        return v;
      };

      const payload = s({
        user_id: user.id,
        file_name: file.name,
        raw_text: rawText,
        full_name: parsed.full_name,
        email: parsed.email,
        phone: parsed.phone,
        summary: parsed.summary,
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        cgpa: parsed.cgpa,
        projects: parsed.projects,
        certifications: parsed.certifications,
      });

      // Upsert resume
      const { data: existing } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await supabase.from('resumes').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('resumes').insert([payload]);
      }

      setHasResume(true);
      setResumeFileName(file.name);
      onAddToast('Resume uploaded and parsed successfully!', 'success');
    } catch (err: any) {
      console.error('Resume upload error:', err);
      onAddToast(`Failed to process resume: ${err.message}`, 'info');
    } finally {
      setParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResumeDelete = async () => {
    try {
      await supabase.from('resumes').delete().eq('user_id', user.id);
      setHasResume(false);
      setResumeFileName('');
      onAddToast('Resume removed.', 'info');
    } catch {
      onAddToast('Failed to remove resume.', 'info');
    }
  };

  // ------------------------------------------------------------
  // Students manage their details through the Resume Analyzer, so
  // the manual profile sections (summary, skills, education,
  // projects, contact) are shown only to alumni/staff.
  // ------------------------------------------------------------
  const canManualEdit = userRole !== 'student';

  // Header education: prefer manually-entered profiles data, fall
  // back to the resume-extracted education (students don't edit it
  // manually, so their header would otherwise show placeholders).
  const primaryEdu = resumeEducation[0];
  const headerSchool = education.school || primaryEdu?.institution || '';
  const headerYears = education.years || primaryEdu?.year || '';
  const headerDegree = education.degree || primaryEdu?.degree || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#9E2A2B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="my-profile-view-container">
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs relative">
        <div className="h-32 sm:h-44 bg-gradient-to-r from-[#FFF0F0] to-[#FFF6F6]" />
        <div className="p-6 sm:p-8 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-10 sm:-mt-16 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            <div className="relative">
              <img
                src={avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'User') + '&background=9E2A2B&color=fff&size=200'}
                alt={fullName || 'Profile'}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-ping absolute" />
                <span className="w-2 h-2 bg-white rounded-full relative" />
              </span>
            </div>
            <div className="space-y-1.5 pb-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{fullName || 'Your Name'}</h1>
                <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-[#9E2A2B] text-[10px] font-black rounded-full uppercase tracking-wider">
                  {role}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-700">
                {headerSchool || 'Your School'} {headerYears ? `\u2022 ${education.years}` : ''}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-slate-300" />
                  <span>{headerDegree || 'Your Degree'}</span>
                </span>
                {resumeCgpa > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-[#FDF2F2] border border-rose-100 rounded-full text-[#9E2A2B]">
                    <span className="text-[10px] font-black">CGPA</span>
                    <span className="text-xs font-black">{resumeCgpa.toFixed(1)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-center md:justify-end pb-2">
            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            ) : (
              <button
                onClick={handleStartEdit}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-3xs cursor-pointer flex items-center justify-center"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Students: profile details come from the resume */}
          {userRole === 'student' && (
            <div className="bg-[#FDF2F2]/50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
              <FileText className="w-4 h-4 text-[#9E2A2B] mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Your summary, skills, education and projects are extracted from your
                resume — upload or update it in the{' '}
                <a
                  href="/resume"
                  className="text-[#9E2A2B] font-bold underline underline-offset-2 hover:text-[#802223]"
                >
                  Resume Analyzer
                </a>{' '}
                to change them.
              </p>
            </div>
          )}

          {/* Full Name */}
          {isEditing && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-[#9E2A2B]" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Full Name</h3>
              </div>
              <input
                type="text"
                value={tempFullName}
                onChange={(e) => setTempFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-sm font-semibold"
                placeholder="Enter your full name"
              />
            </div>
          )}

          {/* Bio — manual entry hidden for students (resume covers it) */}
          {canManualEdit && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-5 h-5 text-[#9E2A2B]" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Professional Summary</h3>
            </div>
            {isEditing ? (
              <textarea
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                rows={4}
                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9E2A2B] text-xs font-semibold leading-relaxed"
                placeholder="Describe your goals, experience, and interests..."
              />
            ) : (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{bio || 'No summary added yet.'}</p>
            )}
          </div>
          )}

          {/* Skills — manual entry hidden for students (resume covers it) */}
          {canManualEdit && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Code className="w-5 h-5 text-[#9E2A2B]" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Technical Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg group">
                  <span>{skill}</span>
                  {isEditing && (
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="p-0.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <form onSubmit={handleAddSkill} className="flex gap-2 pt-2 max-w-sm">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill tag..."
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#9E2A2B] text-white text-xs font-bold rounded-lg hover:bg-[#802223] transition-colors">Add</button>
              </form>
            )}
          </div>
          )}

          {/* Education — manual entry hidden for students (resume covers it) */}
          {canManualEdit && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-[#9E2A2B]" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Education</h3>
            </div>
            {isEditing ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Degree / Field</label>
                  <input type="text" value={tempDegree} onChange={(e) => setTempDegree(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" placeholder="e.g. B.E in Computer Science" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">School</label>
                  <input type="text" value={tempSchool} onChange={(e) => setTempSchool(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" placeholder="e.g. Atria Institute of Technology" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Years</label>
                  <input type="text" value={tempYears} onChange={(e) => setTempYears(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" placeholder="e.g. 2021 — Present" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Details</label>
                  <input type="text" value={tempDetails} onChange={(e) => setTempDetails(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" placeholder="Additional details..." />
                </div>
              </div>
            ) : (
              <div className="flex gap-4 items-start pt-1">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                  <GraduationCap className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-xs font-black text-slate-900">{education.degree || 'No degree added'}</h4>
                    <span className="text-[10px] text-slate-400 font-black font-mono uppercase">{education.years}</span>
                  </div>
                  <p className="text-xs text-[#9E2A2B] font-extrabold leading-none">{education.school}</p>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-0.5">{education.details}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Projects — manual entry hidden for students (resume covers it) */}
          {canManualEdit && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-[#9E2A2B]" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Featured Projects</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {(isEditing ? tempProjects : projects).map((proj, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 relative flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${proj.type === 'code' ? 'bg-rose-50 border-rose-100 text-[#9E2A2B]' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                      <Code className="w-4 h-4" />
                    </div>
                    {isEditing && (
                      <button onClick={() => handleRemoveProject(idx)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 pt-1.5 flex-1">
                    <h4 className="text-xs font-black text-slate-900">{proj.name}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{proj.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-50">
                    {proj.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-400">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add New Project</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name" className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" />
                  <input type="text" value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder="Description" className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" />
                  <input type="text" value={newProjectTags} onChange={(e) => setNewProjectTags(e.target.value)} placeholder="Tags (comma separated)" className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" />
                  <select value={newProjectType} onChange={(e) => setNewProjectType(e.target.value as 'code' | 'other')} className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]">
                    <option value="code">Code</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button onClick={handleAddProject} className="px-4 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-lg hover:bg-[#802223] transition-colors">Add Project</button>
              </div>
            )}
          </div>
          )}

          {/* Parsed Resume Sections (from uploaded resume) */}
          {hasResume && resumeSkills.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Code className="w-5 h-5 text-[#9E2A2B]" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Resume Skills</h3>
                <span className="px-2 py-0.5 bg-[#FDF2F2] text-[#9E2A2B] text-[9px] font-black rounded-full border border-rose-100">AI Extracted</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {resumeSkills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1.5 bg-[#FDF2F2] border border-rose-100 text-[#9E2A2B] text-xs font-bold rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasResume && resumeExperience.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-5 h-5 text-[#9E2A2B]" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Work Experience</h3>
                <span className="px-2 py-0.5 bg-[#FDF2F2] text-[#9E2A2B] text-[9px] font-black rounded-full border border-rose-100">AI Extracted</span>
              </div>
              <div className="space-y-3 pt-1">
                {resumeExperience.map((exp, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-xs font-black text-slate-900">{exp.title}</h4>
                        <span className="text-[10px] text-slate-400 font-black font-mono uppercase">{exp.duration}</span>
                      </div>
                      <p className="text-xs text-[#9E2A2B] font-extrabold leading-none">{exp.company}</p>
                      {exp.description && (
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-0.5">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResume && resumeEducation.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap className="w-5 h-5 text-[#9E2A2B]" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Resume Education</h3>
                <span className="px-2 py-0.5 bg-[#FDF2F2] text-[#9E2A2B] text-[9px] font-black rounded-full border border-rose-100">AI Extracted</span>
              </div>
              <div className="space-y-3 pt-1">
                {resumeEducation.map((edu, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <GraduationCap className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-xs font-black text-slate-900">{edu.degree}</h4>
                        <span className="text-[10px] text-slate-400 font-black font-mono uppercase">{edu.year}</span>
                      </div>
                      <p className="text-xs text-[#9E2A2B] font-extrabold leading-none">{edu.institution}</p>
                      {edu.cgpa > 0 && (
                        <p className="text-[11px] text-slate-500 font-semibold">CGPA: {edu.cgpa}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResume && resumeCertifications.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-[#9E2A2B]" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Certifications</h3>
                <span className="px-2 py-0.5 bg-[#FDF2F2] text-[#9E2A2B] text-[9px] font-black rounded-full border border-rose-100">AI Extracted</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {resumeCertifications.map((cert, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">
                    <Award className="w-3 h-3 text-slate-400" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Resume Upload (Students only) */}
          {userRole === 'student' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#9E2A2B]" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Resume</h4>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
              />
              {parsingResume ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-6 h-6 text-[#9E2A2B] animate-spin" />
                  <p className="text-[11px] font-bold text-slate-500">Parsing resume with AI...</p>
                </div>
              ) : hasResume ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700 truncate">{resumeFileName || 'Resume uploaded'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleResumeDelete}
                      className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    onClick={() => window.location.href = '/resume'}
                    className="w-full px-3 py-2 bg-[#9E2A2B] hover:bg-[#802223] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    View Full Analysis
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-4 border-2 border-dashed border-slate-200 hover:border-[#9E2A2B]/40 rounded-xl transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-300" />
                  <span className="text-xs font-bold text-slate-500">Upload Resume (PDF)</span>
                  <span className="text-[10px] text-slate-400">AI will extract your details</span>
                </button>
              )}
            </div>
          )}

          {/* Contact — manual entry hidden for students (resume covers email) */}
          {canManualEdit && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">Contact & Socials</h4>
            </div>
            <div className="space-y-3 pt-1">
              {isEditing ? (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">LinkedIn</label>
                    <input type="text" value={tempLinkedin} onChange={(e) => setTempLinkedin(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">GitHub</label>
                    <input type="text" value={tempGithub} onChange={(e) => setTempGithub(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#9E2A2B]" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{contact.email || 'No email added'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors">
                    <Linkedin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{contact.linkedin || 'No LinkedIn added'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors">
                    <Github className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{contact.github || 'No GitHub added'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Superadmin role management (renders only for role === 'admin') */}
          <RoleManager />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs font-semibold text-slate-500 text-center sm:text-left">
          This profile represents <span className="font-bold text-slate-800">{fullName || 'your account'}</span>.
        </p>
        <p className="text-[10px] font-mono text-slate-400 tracking-wider">
          &copy; 2026 CIA: Communities in Atria. All rights reserved.
        </p>
      </div>
    </div>
  );
}
