import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

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
  const prompt = `You are a resume parsing AI. Extract structured data from the following resume text.
Return ONLY a valid JSON object (no markdown, no code fences) with this exact schema:

{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "summary": "one paragraph professional summary or empty string",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "e.g. Jun 2023 - Aug 2023",
      "description": "brief description of role"
    }
  ],
  "education": [
    {
      "degree": "e.g. B.Tech Computer Science",
      "institution": "university name",
      "year": "e.g. 2021 - 2025",
      "cgpa": 8.5
    }
  ],
  "cgpa": 0.0,
  "projects": [
    {
      "name": "project name",
      "description": "brief description",
      "tech_stack": ["React", "Node.js", ...]
    }
  ],
  "certifications": ["cert1", "cert2", ...]
}

Rules:
- cgpa should be the overall or latest CGPA as a number (e.g. 8.5). If not found, use 0.
- If a field is not found, use empty string, empty array, or 0 as appropriate.
- Extract ALL skills mentioned anywhere in the resume.
- For experience, include internships, part-time, and full-time roles.
- For projects, include significant academic or personal projects.

RESUME TEXT:
${rawText.slice(0, 15000)}`;

  const response = await genai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
  });

  const text = response.text || '';
  
  // Try to extract JSON from the response
  let cleaned = text.trim();
  
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Find JSON object in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI could not parse resume. Please try again.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParsedResume;
  
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
  const prompt = `You are a candidate-ranking AI. Given a job description and a list of student resumes, score and rank each student.

JOB DESCRIPTION:
${jdText.slice(0, 5000)}

STUDENTS DATA:
${JSON.stringify(students.map(s => ({
  user_id: s.user_id,
  full_name: s.full_name,
  skills: s.skills,
  cgpa: s.cgpa,
  summary: s.summary,
  project_tech: (s.projects || []).flatMap(p => p.tech_stack || []),
  project_descs: (s.projects || []).map(p => p.description || ''),
  experience_descs: (s.experience || []).map(e => e.description || '')
}))).slice(0, 30000)}

Return ONLY a valid JSON array (no markdown, no code fences) with this schema:
[
  {
    "user_id": "uuid",
    "full_name": "name",
    "cgpa": 8.5,
    "score": 85.5,
    "matched_skills": ["skill1", "skill2"],
    "unmatched_jd_skills": ["skill3"],
    "resume_summary": "brief 1-line summary of why this student matches"
  }
]

SCORING RULES:
- Score is 0-100. Higher = better match.
- Skill matching: 50% weight. Compare JD keywords against student skills, project tech stacks, and experience descriptions.
- CGPA: 25% weight. Scale: CGPA 10 = 25pts, CGPA 9 = 22.5pts, CGPA 8 = 20pts, etc.
- Experience relevance: 15% weight. How relevant is their experience to the JD.
- Project relevance: 10% weight. How relevant are their projects to the JD.
- List the top matching skills and skills from JD that the student is missing.
- Sort by score descending (highest first).
- Return ALL students, even those with score 0.`;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await genai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const text = response.text || '';
      
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('AI could not rank candidates. Please try again.');
      }

      const rankings = JSON.parse(jsonMatch[0]) as RankedStudent[];
      return rankings.sort((a, b) => b.score - a.score);
    } catch (err: any) {
      console.error('Gemini API error (attempt', retryCount + 1, '):', err.message);
      
      // Check for rate limit / availability errors
      if (err.message?.includes('high demand') || err.message?.includes('503') || err.status === 'UNAVAILABLE') {
        retryCount++;
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      throw new Error(err.message || 'Failed to rank candidates. Please try again later.');
    }
  }
  
  throw new Error('Failed to rank candidates after multiple attempts. Please try again later.');
}
