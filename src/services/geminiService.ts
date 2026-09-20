import { executeJsonCompletion, cleanAndParseJson } from './aiProvider';

export interface ParsedResume {
  full_name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    cgpa?: number;
  }[];
  cgpa: number;
  projects: {
    name: string;
    description: string;
    tech_stack: string[];
  }[];
  certifications: string[];
}

export async function parseResumeWithAI(rawText: string): Promise<ParsedResume> {
  const systemPrompt = `You are a resume parsing AI. Extract structured data from resume text.
Return ONLY a valid JSON object with this exact schema:
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "summary": "one paragraph professional summary or empty string",
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "string", "company": "string", "duration": "string", "description": "string"}],
  "education": [{"degree": "string", "institution": "string", "year": "string", "cgpa": 0}],
  "cgpa": 0.0,
  "projects": [{"name": "string", "description": "string", "tech_stack": ["React"]}],
  "certifications": ["cert1"]
}
Rules: cgpa = overall/latest as number (0 if not found). Extract ALL skills. Include internships, part-time, full-time roles.`;

  const userPrompt = `RESUME TEXT:\n${rawText.slice(0, 15000)}`;

  const raw = await executeJsonCompletion(systemPrompt, userPrompt);
  const parsed = cleanAndParseJson<ParsedResume>(raw);

  // Ensure arrays exist
  parsed.skills = parsed.skills || [];
  parsed.experience = parsed.experience || [];
  parsed.education = parsed.education || [];
  parsed.projects = parsed.projects || [];
  parsed.certifications = parsed.certifications || [];
  parsed.cgpa = parsed.cgpa || 0;

  return parsed;
}

export interface RankedStudent {
  user_id: string;
  full_name: string;
  cgpa: number;
  score: number;
  matched_skills: string[];
  unmatched_jd_skills: string[];
  resume_summary: string;
}

export async function rankStudentsAgainstJD(
  jdText: string,
  students: {
    user_id: string;
    full_name: string;
    skills: string[];
    cgpa: number;
    summary: string;
    projects: { name: string; description: string; tech_stack: string[] }[];
    experience: { title: string; description: string }[];
  }[]
): Promise<RankedStudent[]> {
  const systemPrompt = `You are a candidate-ranking AI. Given a job description and student resumes, score and rank each student.
Return ONLY a valid JSON array with this schema:
[{"user_id":"uuid","full_name":"name","cgpa":8.5,"score":85.5,"matched_skills":["skill1"],"unmatched_jd_skills":["skill2"],"resume_summary":"brief 1-line summary"}]
SCORING: Score 0-100. Skill matching 50%, CGPA 25%, Experience 15%, Project 10%.
Sort by score descending. Return ALL students, even those with score 0.`;

  const studentData = JSON.stringify(students.map(s => ({
    user_id: s.user_id,
    full_name: s.full_name,
    skills: s.skills,
    cgpa: s.cgpa,
    summary: s.summary,
    project_tech: (s.projects || []).flatMap(p => p.tech_stack || []),
    project_descs: (s.projects || []).map(p => p.description || ''),
    experience_descs: (s.experience || []).map(e => e.description || '')
  }))).slice(0, 30000);

  const userPrompt = `JOB DESCRIPTION:\n${jdText.slice(0, 5000)}\n\nSTUDENTS DATA:\n${studentData}`;

  const raw = await executeJsonCompletion(systemPrompt, userPrompt);
  const rankings = cleanAndParseJson<RankedStudent[]>(raw);
  return rankings.sort((a, b) => b.score - a.score);
}
