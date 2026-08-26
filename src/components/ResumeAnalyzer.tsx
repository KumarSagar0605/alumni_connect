import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Mail,
  Phone,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { parseResumeWithAI, type ParsedResume } from '../services/geminiService';

export default function ResumeAnalyzer() {
  const { user } = useAuth();
  const { addToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    fetchResume();
  }, [user]);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setHasResume(true);
        setResumeId(data.id);
        setFileName(data.file_name || '');
        setResumeData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          summary: data.summary || '',
          skills: data.skills || [],
          experience: data.experience || [],
          education: data.education || [],
          cgpa: data.cgpa || 0,
          projects: data.projects || [],
          certifications: data.certifications || [],
        });
      }
    } catch (err) {
      // No resume found — that's fine
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast('Please upload a PDF file.', 'info');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be under 10MB.', 'info');
      return;
    }

    setParsing(true);
    setFileName(file.name);

    try {
      // Extract text from PDF
      const rawText = (await extractTextFromPDF(file)).replace(/\u0000/g, '');

      if (rawText.trim().length < 50) {
        addToast('Could not extract enough text from PDF. Please try a different file.', 'info');
        setParsing(false);
        return;
      }

      // Parse with Gemini AI
      const parsed = await parseResumeWithAI(rawText);

      // Sanitize null chars for PostgreSQL
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

      // Store in Supabase
      const resumePayload = s({
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

      if (resumeId) {
        // Update existing
        const { error } = await supabase
          .from('resumes')
          .update(resumePayload)
          .eq('id', resumeId);
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('resumes')
          .insert([resumePayload])
          .select()
          .single();
        if (error) throw error;
        setResumeId(data.id);
      }

      setResumeData(parsed);
      setHasResume(true);
      addToast('Resume parsed and saved successfully!', 'success');
    } catch (err: any) {
      console.error('Resume parsing error:', err);
      addToast(`Failed to parse resume: ${err.message}`, 'info');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!resumeId) return;
    try {
      const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
      if (error) throw error;
      setHasResume(false);
      setResumeData(null);
      setResumeId(null);
      setFileName('');
      addToast('Resume removed.', 'info');
    } catch (err) {
      addToast('Failed to delete resume.', 'info');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="flex items-center gap-3 justify-center py-12">
          <Loader2 className="w-5 h-5 text-[#9E2A2B] animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading resume data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#9E2A2B]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Resume Analyzer</h3>
            <p className="text-[11px] text-slate-400 font-semibold">AI-powered resume parsing & scoring</p>
          </div>
        </div>
        {hasResume && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Uploaded
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              parsing
                ? 'border-[#9E2A2B]/30 bg-[#FDF2F2]/30'
                : 'border-slate-200 hover:border-[#9E2A2B]/40 hover:bg-slate-50/50'
            }`}
            onClick={() => !parsing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            {parsing ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 text-[#9E2A2B] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Analyzing your resume with AI...</p>
                <p className="text-[11px] text-slate-400">Extracting skills, experience, and education</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-600">
                    {hasResume ? 'Replace your resume' : 'Upload your resume'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">PDF format, max 10MB</p>
                </div>
              </div>
            )}
          </div>

          {hasResume && fileName && (
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">{fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Re-upload"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete resume"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Parsed Results */}
        {resumeData && (
          <div className="mt-6 space-y-5">
            {/* CGPA Highlight */}
            {resumeData.cgpa > 0 && (
              <div className="bg-gradient-to-r from-[#FDF2F2] to-white border border-rose-100 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#9E2A2B] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your CGPA</p>
                  <p className="text-xl font-black text-slate-900">{resumeData.cgpa.toFixed(1)}</p>
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parsed Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resumeData.full_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-16">Name</span>
                    <span className="text-xs font-semibold text-slate-700">{resumeData.full_name}</span>
                  </div>
                )}
                {resumeData.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{resumeData.email}</span>
                  </div>
                )}
                {resumeData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">{resumeData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {resumeData.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> Extracted Skills ({resumeData.skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {resumeData.skills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {resumeData.experience.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Experience ({resumeData.experience.length})
                </h4>
                <div className="space-y-2">
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{exp.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{exp.duration}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">{exp.company}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resumeData.projects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Projects ({resumeData.projects.length})
                </h4>
                <div className="space-y-2">
                  {resumeData.projects.map((proj, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-800">{proj.name}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{proj.description}</p>
                      {proj.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.tech_stack.map((t, j) => (
                            <span key={j} className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!hasResume && !parsing && (
          <div className="mt-6 text-center py-8">
            <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No resume uploaded yet</p>
            <p className="text-[11px] text-slate-300 mt-1">Upload a PDF to let AI extract your details</p>
          </div>
        )}
      </div>
    </div>
  );
}
