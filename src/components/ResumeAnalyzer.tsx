import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
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
  Plus,
  Edit2,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { parseResumeWithAI, type ParsedResume } from '../services/geminiService';

// ============================================================
// HEURISTIC FALLBACK PARSER (non-AI safety net)
// ------------------------------------------------------------
// Triggers ONLY when parseResumeWithAI() throws (rate limits,
// timeouts, malformed JSON, network errors). It does not touch
// parseResumeWithAI internals or the pdfjs-dist extraction.
// Return shape matches the ParsedResume interface exactly;
// complex arrays (experience/projects/certifications) return []
// so the UI never crashes.
// ============================================================

/** Static dictionary of common CS / tech stack terms. */
const TECH_SKILLS: readonly string[] = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift',
  'PHP', 'Ruby', 'Perl', 'Scala', 'Dart', 'SQL', 'HTML', 'CSS', 'Shell', 'Bash', 'MATLAB',
  // Frontend
  'React', 'React Native', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Redux', 'Tailwind CSS',
  'Bootstrap', 'Material UI', 'jQuery', 'Sass', 'Webpack', 'Vite', 'Three.js',
  // Backend
  'Node.js', 'NodeJS', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring',
  'ASP.NET', '.NET', 'Laravel', 'Ruby on Rails', 'REST API', 'GraphQL', 'Firebase',
  'Supabase', 'Socket.io', 'JWT', 'Microservices',
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'MariaDB', 'DynamoDB',
  'Elasticsearch',
  // Cloud / DevOps / Tools
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible',
  'Git', 'GitHub', 'GitLab', 'Linux', 'Nginx', 'Vercel', 'Netlify', 'Heroku', 'Postman',
  'Jira', 'Agile', 'Scrum',
  // CS fundamentals
  'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks',
  'System Design', 'Design Patterns',
  // Data / ML
  'Machine Learning', 'Deep Learning', 'Data Science', 'Data Analysis', 'NLP', 'Computer Vision',
  'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'OpenCV',
  'Spark', 'Hadoop', 'Power BI', 'Tableau', 'Excel', 'Statistics',
  // Design / Mobile / Testing
  'Figma', 'Photoshop', 'Canva', 'Flutter', 'Android', 'iOS', 'Xcode', 'Unity',
  'Selenium', 'Cypress', 'Jest',
];

/** Words that must never be mistaken for a person's name. */
const NAME_STOP_WORDS = new Set<string>([
  'summary', 'objective', 'profile', 'profiles', 'about', 'me', 'myself', 'education',
  'educational', 'qualifications', 'skills', 'skill', 'technical', 'soft', 'key', 'relevant',
  'experience', 'internship', 'internships', 'work', 'training', 'projects', 'project',
  'certifications', 'certificates', 'awards', 'honors', 'honours', 'achievements', 'activities',
  'languages', 'hobbies', 'interests', 'references', 'declaration', 'contact', 'details',
  'information', 'info', 'resume', 'curriculum', 'vitae', 'career', 'professional', 'personal',
  'academic', 'extra', 'curricular', 'positions', 'responsibility', 'responsibilities',
  'strengths', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'website',
  'date', 'birth', 'gender', 'nationality', 'marital', 'status', 'name', 'candidate', 'full',
  'page', 'sheet', 'section', 'publications', 'patents', 'volunteer', 'coursework', 'semester',
  'school', 'college', 'university', 'degree', 'grades', 'transcript',
  // Common header glue words (a header is ALL of these + something else;
  // a person's name is never made up only of these)
  'of', 'and', 'the', 'in', 'for', 'with', 'to', 'a', 'an', 'on', 'at', 'by', 'from', 'my',
]);

/** Job-title words that must never be mistaken for a person's name. */
const TITLE_WORDS = new Set<string>([
  'representative', 'engineer', 'engineering', 'developer', 'development', 'intern',
  'internship', 'student', 'undergraduate', 'graduate', 'graduation', 'aspiring',
  'professional', 'analyst', 'manager', 'lead', 'leader', 'head', 'associate', 'consultant',
  'designer', 'architect', 'scientist', 'researcher', 'teacher', 'professor', 'executive',
  'specialist', 'technician', 'freelancer', 'entrepreneur', 'candidate', 'applicant',
  'pursuing', 'studying', 'enthusiast', 'class', 'trainee', 'officer', 'coordinator',
  'administrator', 'supervisor', 'advisor', 'mentor',
]);

const SECTION_HEADER_RE =
  /\b(?:summary|objective|education|skills|experience|projects|contact|profile|certifications|career|personal|address|declaration)\b/i;

function looksLikeName(line: string): boolean {
  let s = line.trim();
  // Strip labels like "Name: John Doe"
  s = s.replace(/^(?:full\s+name|name|candidate)\s*[:\-–]\s*/i, '').trim();
  if (s.length < 3 || s.length > 60) return false;
  if (s.includes('@') || /https?:\/\//i.test(s)) return false;
  if (/\d/.test(s)) return false;
  if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(s)) return false;
  const words = s.split(/\s+/).map((w) => w.replace(/[:.,]+$/, ''));
  if (words.length < 1 || words.length > 5) return false;
  // Every word is a section header keyword (e.g. "Technical Skills",
  // "Educational Qualifications", "Positions of Responsibility")
  if (words.every((w) => NAME_STOP_WORDS.has(w.toLowerCase()))) return false;
  // Any word is a job title ("Class Representative", "Software Engineer")
  if (words.some((w) => TITLE_WORDS.has(w.toLowerCase()))) return false;
  // ALL-CAPS lines with 3+ words are almost always headers
  // ("EXTRA CURRICULAR ACTIVITIES"). Two-word all-caps names like
  // "RAHUL SHARMA" are extremely common on resumes, so allow them.
  if (s === s.toUpperCase() && words.length >= 3) return false;
  return true;
}

/** Positional name heuristic: scan the head of the document for the first name-like segment. */
function extractName(text: string): string {
  let head = text.slice(0, 400);

  const cuts = [
    head.search(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/), // before email
    head.search(/\+?\d[\d\s().-]{6,18}\d/), // before phone-like digits
    head.search(SECTION_HEADER_RE), // before first section header
    head.search(/https?:\/\//i), // before URLs
  ];
  const validCuts = cuts.filter((i) => i > 0);
  if (validCuts.length > 0) head = head.slice(0, Math.min(...validCuts));

  const segments = head
    .split(/\n+|\s{2,}|\s[|•●▪◦]\s|\s[-–—]\s/)
    .map((seg) => seg.replace(/^[•●▪◦\s]+/, '').trim())
    .filter(Boolean);

  for (const seg of segments.slice(0, 8)) {
    if (looksLikeName(seg)) return seg;
  }
  return '';
}

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

function extractPhone(text: string): string {
  // Indian mobile number first (most common for this platform)
  const inMobile = text.match(/(?:\+91[\s-]?)?(?:\b91[\s-]?)?\b[6-9]\d{9}\b/);
  if (inMobile) return inMobile[0].replace(/\s+/g, ' ').trim();
  // Generic: any digit run of 10-15 digits with separators
  const candidates = text.match(/\+?\d[\d\s().-]{6,18}\d/g) || [];
  for (const c of candidates) {
    const digits = c.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return c.replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

/** CGPA as a number out of 10 (0 when not found). */
function extractCgpa(text: string): number {
  const patterns = [
    /\b(?:cgpa|c\.g\.p\.a|gpa)\b[^\d]{0,12}(\d{1,2}(?:\.\d{1,2})?)\s*(?:\/\s*10\b)?/i,
    /\b(\d{1,2}\.\d{1,2})\s*\/\s*10\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = parseFloat(m[1]);
      if (v > 0 && v <= 10) return v;
    }
  }
  return 0;
}

function extractGraduationYear(text: string): string {
  const patterns = [
    /(?:graduat\w+|batch|class\s+of|year\s+of\s+graduation|pass(?:ed)?\s+out)[^0-9]{0,30}((?:19|20)\d{2})/i,
    /((?:19|20)\d{2})\s*(?:[-–—]|to)\s*(?:expected\s+)?(?:graduation|graduat\w*)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  // Fallback: a year near a degree/education mention. Take the LAST
  // year in the window so ranges like "2022 - 2026" resolve to the
  // graduation year (2026), not the start year.
  const deg =
    /(?:b\.?tech|b\.?e\.?|bachelor|m\.?tech|m\.?e\.?|b\.?sc|m\.?sc|mba|m\.?ba|bca|mca|ph\.?d|diploma|education)\b/i.exec(
      text
    );
  if (deg && deg.index !== undefined) {
    const window = text.slice(deg.index, deg.index + 120);
    const years = window.match(/\b(?:19|20)\d{2}\b/g);
    if (years) return years[years.length - 1];
  }
  return '';
}

/** Cut a candidate summary at the next section header. */
function clipAtHeader(s: string): string {
  const cut = s.search(
    /\b(?:education|skills|technical\s+skills|experience|work\s+experience|projects|certifications|awards|achievements|activities|languages|references|declaration)\b/i
  );
  if (cut > 0) s = s.slice(0, cut);
  return s.replace(/\s+/g, ' ').trim().slice(0, 400);
}

function extractSummary(text: string): string {
  const m =
    text.match(/\b(?:professional\s+)?summary\b\s*[:\-–]?\s*/i) ||
    text.match(/\b(?:career|professional)\s+objective\b\s*[:\-–]?\s*/i);
  if (!m || m.index === undefined) return '';
  return clipAtHeader(text.slice(m.index + m[0].length));
}

/** Light education heuristic: first degree mention + nearby institution. */
function extractEducation(
  text: string,
  gradYear: string,
  cgpa: number
): ParsedResume['education'] {
  const degreeRe =
    /\b(?:b\.?tech|b\.?e\.?|bachelor(?:'s)?(?:\s+of\s+[A-Za-z]+)?|b\.?sc(?:\s+[A-Za-z]+)?|m\.?tech|m\.?e\.?|m\.?sc|mba|m\.?ba|bca|mca|ph\.?d|diploma)\b/i;
  const m = degreeRe.exec(text);
  if (!m || m.index === undefined) return [];

  const window = text.slice(Math.max(0, m.index - 60), m.index + 220);
  const instMatch = window.match(
    /([A-Z][A-Za-z&'.\s]{3,70}?(?:College|University|Institute|School|Academy|Polytechnic))/
  );
  const label = m[0].trim();

  return [
    {
      degree: label.charAt(0).toUpperCase() + label.slice(1),
      institution: instMatch ? instMatch[1].replace(/\s+/g, ' ').trim() : '',
      year: gradYear,
      ...(cgpa > 0 ? { cgpa } : {}),
    },
  ];
}

/** Match raw text against the static skill dictionary (case-insensitive, word-boundary aware). */
function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of TECH_SKILLS) {
    const esc = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^a-z0-9+#])${esc}(?:[^a-z0-9+#]|$)`);
    if (re.test(lower)) found.add(skill);
  }
  return Array.from(found);
}

/**
 * Deterministic, non-AI fallback parser.
 * Only called when parseResumeWithAI() fails.
 */
function heuristicFallbackParser(rawText: string): ParsedResume {
  const text = rawText;
  const cgpa = extractCgpa(text);
  const gradYear = extractGraduationYear(text);

  return {
    full_name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    summary: extractSummary(text),
    skills: extractSkills(text),
    experience: [], // complex — cannot be heuristically parsed (per spec)
    education: extractEducation(text, gradYear, cgpa),
    cgpa,
    projects: [], // complex — cannot be heuristically parsed (per spec)
    certifications: [], // complex — cannot be heuristically parsed (per spec)
  };
}

/** Strip PostgreSQL-illegal null characters from any payload shape. */
const sanitizePg = (v: any): any => {
  if (typeof v === 'string') return v.replace(/\u0000/g, '');
  if (Array.isArray(v)) return v.map(sanitizePg);
  if (v && typeof v === 'object') {
    const o: any = {};
    for (const k of Object.keys(v)) o[k] = sanitizePg(v[k]);
    return o;
  }
  return v;
};

const editInputCls =
  'mt-1 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-200';

/** Small labeled text input used by the edit form. */
function EditField({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={editInputCls}
      />
    </label>
  );
}

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

  // Fallback (non-AI) parsing state
  const [pendingFallback, setPendingFallback] = useState<{
    parsed: ParsedResume;
    rawText: string;
    fileName: string;
  } | null>(null);
  const [fallbackExpInput, setFallbackExpInput] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  // Manual edit mode state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<ParsedResume | null>(null);
  const [editCgpa, setEditCgpa] = useState('');
  const [saving, setSaving] = useState(false);

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
        .maybeSingle();

      if (data) {
        setHasResume(true);
        setResumeId(data.id);
        setFileName(data.file_name || '');
        setIsFallback(data.parsing_status === 'partial_fallback');
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
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

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

  // ------------------------------------------------------------
  // Shared persistence helper — used by both the AI path and the
  // heuristic fallback path. Adds parsing_status so the frontend
  // knows whether AI or fallback produced the data.
  // ------------------------------------------------------------
  const saveResume = async (
    rawText: string,
    outFileName: string,
    parsed: ParsedResume,
    usedFallback: boolean
  ) => {
    // Sanitize null chars for PostgreSQL (shared module-level helper)
    const resumePayload = sanitizePg({
      user_id: user.id,
      file_name: outFileName,
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
      parsing_status: usedFallback ? 'partial_fallback' : 'ai_parsed',
    });

    // Safety net: if the parsing_status column hasn't been added
    // to the resumes table yet, retry once without it so the
    // upload never breaks. (Run client/sql/add_parsing_status.sql)
    const withoutStatus = (p: any) => {
      const { parsing_status, ...rest } = p;
      return rest;
    };

    if (resumeId) {
      // Update existing
      let { error } = await supabase.from('resumes').update(resumePayload).eq('id', resumeId);
      if (error && String(error.message || '').includes('parsing_status')) {
        ({ error } = await supabase
          .from('resumes')
          .update(withoutStatus(resumePayload))
          .eq('id', resumeId));
      }
      if (error) throw error;
    } else {
      // Insert new
      let { data, error } = await supabase
        .from('resumes')
        .insert([resumePayload])
        .select()
        .maybeSingle();
      if (error && String(error.message || '').includes('parsing_status')) {
        ({ data, error } = await supabase
          .from('resumes')
          .insert([withoutStatus(resumePayload)])
          .select()
          .maybeSingle());
      }
      if (error) throw error;
      setResumeId(data.id);
    }

    setResumeData(parsed);
    setHasResume(true);
    setIsFallback(usedFallback);
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
    setPendingFallback(null);
    setFallbackExpInput('');
    setEditing(false);
    setEditData(null);

    try {
      // Extract text from PDF
      const rawText = (await extractTextFromPDF(file)).replace(/\u0000/g, '');

      if (rawText.trim().length < 50) {
        addToast('Could not extract enough text from PDF. Please try a different file.', 'info');
        setParsing(false);
        return;
      }

      // --- Circuit breaker: AI first, heuristic fallback on failure ---
      let parsed: ParsedResume;
      try {
        parsed = await parseResumeWithAI(rawText);
      } catch (aiErr) {
        // Log the AI error for debugging, then fall back to heuristics
        console.error(
          '[ResumeAnalyzer] parseResumeWithAI failed — using heuristic fallback:',
          aiErr
        );
        parsed = heuristicFallbackParser(rawText);
        // Prompt the user BEFORE the Supabase insert so they can
        // review the heuristic output and fill in experience manually.
        setPendingFallback({ parsed, rawText, fileName: file.name });
        addToast(
          'AI parsing failed. Basic details were extracted automatically — please review before saving.',
          'info'
        );
        return;
      }

      await saveResume(rawText, file.name, parsed, false);
      addToast('Resume parsed and saved successfully!', 'success');
    } catch (err: any) {
      console.error('Resume parsing error:', err);
      addToast(`Failed to parse resume: ${err.message}`, 'info');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // User confirmed the fallback prompt — allows optional manual
  // experience entry BEFORE the final submission to Supabase.
  const confirmFallbackSave = async () => {
    if (!pendingFallback) return;

    const parsed: ParsedResume = { ...pendingFallback.parsed };
    const expLines = fallbackExpInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    parsed.experience = expLines.map((line) => {
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      return {
        title: parts[0] || line,
        company: parts[1] || '',
        duration: parts[2] || '',
        description: parts[3] || '',
      };
    });

    setParsing(true);
    try {
      await saveResume(pendingFallback.rawText, pendingFallback.fileName, parsed, true);
      setPendingFallback(null);
      setFallbackExpInput('');
      // Open the editor immediately so the user can complete the
      // sections the fallback parser could not fill in.
      setEditData(JSON.parse(JSON.stringify(parsed)) as ParsedResume);
      setEditCgpa(parsed.cgpa > 0 ? String(parsed.cgpa) : '');
      setEditing(true);
      addToast(
        'Resume saved — complete the remaining sections below, then press Save changes.',
        'info'
      );
    } catch (err: any) {
      console.error('Fallback save error:', err);
      addToast(`Failed to save resume: ${err.message}`, 'info');
    } finally {
      setParsing(false);
    }
  };

  const cancelFallback = () => {
    setPendingFallback(null);
    setFallbackExpInput('');
    setFileName('');
    addToast('Upload discarded.', 'info');
  };

  // ------------------------------------------------------------
  // Manual edit mode — lets the user add/correct EVERY section
  // (summary, skills, experience, projects, education,
  // certifications) directly in the UI, then save to Supabase.
  // ------------------------------------------------------------
  const startEditing = () => {
    if (!resumeData) return;
    setEditData(JSON.parse(JSON.stringify(resumeData)) as ParsedResume);
    setEditCgpa(resumeData.cgpa > 0 ? String(resumeData.cgpa) : '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData(null);
  };

  const updateEdit = (patch: Partial<ParsedResume>) =>
    setEditData((d) => (d ? { ...d, ...patch } : d));

  const updateExp = (i: number, patch: Partial<ParsedResume['experience'][number]>) =>
    setEditData((d) =>
      d
        ? {
            ...d,
            experience: d.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
          }
        : d
    );

  const updateProj = (i: number, patch: Partial<ParsedResume['projects'][number]>) =>
    setEditData((d) =>
      d
        ? {
            ...d,
            projects: d.projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
          }
        : d
    );

  const updateEdu = (i: number, patch: Partial<ParsedResume['education'][number]>) =>
    setEditData((d) =>
      d
        ? {
            ...d,
            education: d.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
          }
        : d
    );

  const updateCert = (i: number, v: string) =>
    setEditData((d) =>
      d ? { ...d, certifications: d.certifications.map((c, idx) => (idx === i ? v : c)) } : d
    );

  const addExp = () =>
    setEditData((d) =>
      d
        ? {
            ...d,
            experience: [...d.experience, { title: '', company: '', duration: '', description: '' }],
          }
        : d
    );
  const removeExp = (i: number) =>
    setEditData((d) =>
      d ? { ...d, experience: d.experience.filter((_, idx) => idx !== i) } : d
    );

  const addProj = () =>
    setEditData((d) =>
      d
        ? { ...d, projects: [...d.projects, { name: '', description: '', tech_stack: [] }] }
        : d
    );
  const removeProj = (i: number) =>
    setEditData((d) => (d ? { ...d, projects: d.projects.filter((_, idx) => idx !== i) } : d));

  const addEdu = () =>
    setEditData((d) =>
      d
        ? { ...d, education: [...d.education, { degree: '', institution: '', year: '' }] }
        : d
    );
  const removeEdu = (i: number) =>
    setEditData((d) => (d ? { ...d, education: d.education.filter((_, idx) => idx !== i) } : d));

  const addCert = () =>
    setEditData((d) => (d ? { ...d, certifications: [...d.certifications, ''] } : d));
  const removeCert = (i: number) =>
    setEditData((d) =>
      d ? { ...d, certifications: d.certifications.filter((_, idx) => idx !== i) } : d
    );

  /** Split a comma-separated editing buffer into a clean, deduped list. */
  const parseList = (parts: string[]): string[] =>
    Array.from(
      new Set(parts.flatMap((s) => s.split(',').map((x) => x.trim()).filter(Boolean)))
    );

  const saveEdits = async () => {
    if (!editData || !resumeId) return;
    setSaving(true);
    try {
      const cgpaVal = parseFloat(editCgpa);
      const updated: ParsedResume = {
        ...editData,
        full_name: editData.full_name.trim(),
        email: editData.email.trim(),
        phone: editData.phone.trim(),
        summary: editData.summary.trim(),
        skills: parseList(editData.skills),
        experience: editData.experience
          .map((e) => ({
            ...e,
            title: e.title.trim(),
            company: e.company.trim(),
            duration: e.duration.trim(),
            description: e.description.trim(),
          }))
          .filter((e) => e.title || e.company),
        education: editData.education
          .map((e) => ({
            ...e,
            degree: e.degree.trim(),
            institution: e.institution.trim(),
            year: e.year.trim(),
          }))
          .filter((e) => e.degree || e.institution),
        cgpa: Number.isFinite(cgpaVal) ? Math.min(10, Math.max(0, cgpaVal)) : 0,
        projects: editData.projects
          .map((p) => ({
            ...p,
            name: p.name.trim(),
            description: p.description.trim(),
            tech_stack: parseList(p.tech_stack),
          }))
          .filter((p) => p.name),
        certifications: editData.certifications.map((c) => c.trim()).filter(Boolean),
      };

      const payload = sanitizePg({
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        summary: updated.summary,
        skills: updated.skills,
        experience: updated.experience,
        education: updated.education,
        cgpa: updated.cgpa,
        projects: updated.projects,
        certifications: updated.certifications,
        parsing_status: 'manually_edited',
      });

      let { error } = await supabase.from('resumes').update(payload).eq('id', resumeId);
      if (error && String(error.message || '').includes('parsing_status')) {
        const { parsing_status, ...rest } = payload;
        ({ error } = await supabase.from('resumes').update(rest).eq('id', resumeId));
      }
      if (error) throw error;

      setResumeData(updated);
      setIsFallback(false);
      setEditing(false);
      setEditData(null);
      addToast('Resume details saved.', 'success');
    } catch (err: any) {
      console.error('Resume edit save error:', err);
      addToast(`Failed to save changes: ${err.message}`, 'info');
    } finally {
      setSaving(false);
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
      setIsFallback(false);
      setEditing(false);
      setEditData(null);
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

        {/* Heuristic fallback prompt — shown BEFORE the Supabase insert
            so the user can review and fill in experience manually */}
        {pendingFallback && !parsing && (
          <div className="mt-4 border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-800">
                  AI parsing unavailable — basic details extracted automatically
                </p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  Detected:{' '}
                  <span className="font-bold">
                    {pendingFallback.parsed.full_name || 'name not detected'}
                  </span>
                  {' · '}
                  {pendingFallback.parsed.skills.length} skills
                  {pendingFallback.parsed.cgpa > 0
                    ? ` · CGPA ${pendingFallback.parsed.cgpa}`
                    : ''}
                  . Experience &amp; Projects could not be detected — fill them in
                  below before saving, or add every section afterwards in the editor
                  that opens automatically.
                </p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Experience (optional — one per line: Title | Company | Duration)
              </label>
              <textarea
                value={fallbackExpInput}
                onChange={(e) => setFallbackExpInput(e.target.value)}
                rows={3}
                placeholder={'Software Intern | Acme Corp | Jun 2024 – Aug 2024\nWeb Developer | Freelance | 2023 – Present'}
                className="mt-1 w-full text-xs border border-amber-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmFallbackSave}
                className="px-4 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-lg hover:bg-[#7d1f20] transition-colors"
              >
                Save resume
              </button>
              <button
                onClick={cancelFallback}
                className="px-4 py-2 bg-white border border-amber-200 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Persistent notice: this resume was saved without AI */}
        {isFallback && !pendingFallback && resumeData && !editing && (
          <div className="mt-4 flex items-start gap-2 border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                Saved in fallback mode — this resume was parsed without AI. Skills and
                contact details were extracted heuristically; please review them and
                complete your Experience / Projects / Education / Certifications
                manually.
              </p>
              <button
                onClick={startEditing}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9E2A2B] text-white text-[11px] font-bold rounded-lg hover:bg-[#7d1f20] transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit &amp; complete sections
              </button>
            </div>
          </div>
        )}

        {/* Parsed Results — EDIT MODE (add/correct every section manually) */}
        {resumeData && editing && editData && (
          <div className="mt-6 border border-rose-100 bg-[#FDF2F2]/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-[#9E2A2B] uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Edit resume details
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                Fill only what you know
              </span>
            </div>

            {/* Personal info + CGPA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <EditField label="Full name" value={editData.full_name} onChange={(v) => updateEdit({ full_name: v })} placeholder="Your full name" />
              <EditField label="Email" value={editData.email} onChange={(v) => updateEdit({ email: v })} placeholder="you@example.com" />
              <EditField label="Phone" value={editData.phone} onChange={(v) => updateEdit({ phone: v })} placeholder="+91 9876543210" />
              <EditField label="CGPA (0–10)" value={editCgpa} onChange={setEditCgpa} placeholder="e.g. 8.5" />
            </div>

            {/* Summary */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Summary
              </span>
              <textarea
                rows={3}
                value={editData.summary}
                onChange={(e) => updateEdit({ summary: e.target.value })}
                placeholder="One-paragraph professional summary..."
                className={editInputCls}
              />
            </div>

            {/* Skills */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> Skills (comma-separated)
              </span>
              <textarea
                rows={2}
                value={editData.skills.join(', ')}
                onChange={(e) => updateEdit({ skills: [e.target.value] })}
                placeholder="React, Node.js, TypeScript, Supabase"
                className={editInputCls}
              />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Experience ({editData.experience.length})
                </span>
                <button
                  type="button"
                  onClick={addExp}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:border-[#9E2A2B]/40 hover:text-[#9E2A2B] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {editData.experience.length === 0 && (
                <p className="text-[11px] text-slate-400 font-semibold bg-white border border-dashed border-slate-200 rounded-lg px-3 py-3 text-center">
                  No experience yet — add internships, part-time or full-time roles.
                </p>
              )}
              {editData.experience.map((exp, i) => (
                <div key={i} className="relative bg-white border border-slate-100 rounded-lg p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => removeExp(i)}
                    title="Remove experience"
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                    <EditField label="Title" value={exp.title} onChange={(v) => updateExp(i, { title: v })} placeholder="Software Intern" />
                    <EditField label="Company" value={exp.company} onChange={(v) => updateExp(i, { company: v })} placeholder="Acme Corp" />
                    <EditField label="Duration" value={exp.duration} onChange={(v) => updateExp(i, { duration: v })} placeholder="Jun 2024 – Aug 2024" />
                  </div>
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                    <textarea
                      rows={2}
                      value={exp.description}
                      onChange={(e) => updateExp(i, { description: e.target.value })}
                      placeholder="What you did in this role..."
                      className={editInputCls}
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Projects ({editData.projects.length})
                </span>
                <button
                  type="button"
                  onClick={addProj}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:border-[#9E2A2B]/40 hover:text-[#9E2A2B] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {editData.projects.length === 0 && (
                <p className="text-[11px] text-slate-400 font-semibold bg-white border border-dashed border-slate-200 rounded-lg px-3 py-3 text-center">
                  No projects yet — add your academic or personal projects.
                </p>
              )}
              {editData.projects.map((proj, i) => (
                <div key={i} className="relative bg-white border border-slate-100 rounded-lg p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => removeProj(i)}
                    title="Remove project"
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="pr-6">
                    <EditField label="Project name" value={proj.name} onChange={(v) => updateProj(i, { name: v })} placeholder="Campus Connect" />
                  </div>
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => updateProj(i, { description: e.target.value })}
                      placeholder="What the project does..."
                      className={editInputCls}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tech stack (comma-separated)</span>
                    <input
                      type="text"
                      value={proj.tech_stack.join(', ')}
                      onChange={(e) => updateProj(i, { tech_stack: [e.target.value] })}
                      placeholder="React, Node.js, Supabase"
                      className={editInputCls}
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Education ({editData.education.length})
                </span>
                <button
                  type="button"
                  onClick={addEdu}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:border-[#9E2A2B]/40 hover:text-[#9E2A2B] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {editData.education.length === 0 && (
                <p className="text-[11px] text-slate-400 font-semibold bg-white border border-dashed border-slate-200 rounded-lg px-3 py-3 text-center">
                  No education added yet.
                </p>
              )}
              {editData.education.map((edu, i) => (
                <div key={i} className="relative bg-white border border-slate-100 rounded-lg p-3 pr-6">
                  <button
                    type="button"
                    onClick={() => removeEdu(i)}
                    title="Remove education"
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <EditField label="Degree" value={edu.degree} onChange={(v) => updateEdu(i, { degree: v })} placeholder="B.Tech in CSE" />
                    <EditField label="Institution" value={edu.institution} onChange={(v) => updateEdu(i, { institution: v })} placeholder="College / University" />
                    <EditField label="Year" value={edu.year} onChange={(v) => updateEdu(i, { year: v })} placeholder="2026" />
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Certifications ({editData.certifications.length})
                </span>
                <button
                  type="button"
                  onClick={addCert}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:border-[#9E2A2B]/40 hover:text-[#9E2A2B] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {editData.certifications.length === 0 && (
                <p className="text-[11px] text-slate-400 font-semibold bg-white border border-dashed border-slate-200 rounded-lg px-3 py-3 text-center">
                  No certifications added yet.
                </p>
              )}
              {editData.certifications.map((cert, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <EditField
                      label={`Certification ${i + 1}`}
                      value={cert}
                      onChange={(v) => updateCert(i, v)}
                      placeholder="AWS Certified Cloud Practitioner"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCert(i)}
                    title="Remove certification"
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-rose-100">
              <button
                type="button"
                onClick={saveEdits}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-lg hover:bg-[#7d1f20] transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <span className="text-[10px] text-slate-400 font-semibold ml-auto">
                Saved to your resume record
              </span>
            </div>
          </div>
        )}

        {/* Parsed Results — VIEW MODE */}
        {resumeData && !editing && (
          <div className="mt-6 space-y-5">
            {/* Edit entry point (always available, incl. fallback resumes) */}
            <div className="flex justify-end">
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:border-[#9E2A2B]/40 hover:text-[#9E2A2B] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit details
              </button>
            </div>

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

            {/* Summary */}
            {resumeData.summary && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Summary
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 rounded-xl p-3">
                  {resumeData.summary}
                </p>
              </div>
            )}

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

            {/* Education */}
            {resumeData.education.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Education ({resumeData.education.length})
                </h4>
                <div className="space-y-2">
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{edu.degree}</span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {edu.year}
                          {edu.cgpa ? ` · CGPA ${edu.cgpa}` : ''}
                        </span>
                      </div>
                      {edu.institution && (
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {edu.institution}
                        </p>
                      )}
                    </div>
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
                      {exp.description && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{exp.description}</p>
                      )}
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
            {/* Certifications */}
            {resumeData.certifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Certifications ({resumeData.certifications.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {resumeData.certifications.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg">
                      {c}
                    </span>
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
