// Test harness: extracts heuristicFallbackParser from ResumeAnalyzer.tsx
// (the EXACT code that ships), compiles it, and runs assertions.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const src = fs.readFileSync(path.join(__dirname, 'src/components/ResumeAnalyzer.tsx'), 'utf8');

const start = src.indexOf('const TECH_SKILLS');
// End at the first helper that follows the parser block (sanitizePg /
// EditField contain JSX, which must not be included in the .ts extract)
const candidates = [
  src.indexOf('/** Strip PostgreSQL-illegal null characters'),
  src.indexOf('const sanitizePg'),
  src.indexOf('export default function ResumeAnalyzer'),
].filter((i) => i > start);
const end = Math.min(...candidates);
if (start < 0 || end <= start) {
  console.error('FAIL: could not locate parser block in ResumeAnalyzer.tsx');
  process.exit(1);
}
const block = src.slice(start, end);

const tmpTs = path.join(__dirname, '__fallback_parser_test.ts');
const tmpJs = path.join(__dirname, '__fallback_parser_test.cjs');
fs.writeFileSync(tmpTs, block + '\nexport { heuristicFallbackParser };\n');

// Compile with esbuild (already in node_modules via vite)
execSync(`npx esbuild "${tmpTs}" --bundle --format=cjs --outfile="${tmpJs}"`, {
  cwd: __dirname,
  stdio: 'inherit',
});

const { heuristicFallbackParser } = require(tmpJs);

// --- Sample resume text (realistic single-page student resume) ---
const sample = `RAHUL SHARMA
rahul.sharma2026@gmail.com | +91 9876543210 | Bengaluru, India
linkedin.com/in/rahulsharma | github.com/rahulsharma

SUMMARY
Computer Science undergraduate passionate about full-stack development and machine learning.

EDUCATION
B.Tech in Computer Science and Engineering, Sri Venkateswara College of Engineering, 2026, CGPA: 8.7/10

SKILLS
React, Node.js, TypeScript, Python, PostgreSQL, Supabase, Docker, Git, Machine Learning, Tailwind CSS

EXPERIENCE
Software Intern, Zoho Corporation, Jun 2025 - Aug 2025
Built internal dashboards using React and TypeScript.

PROJECTS
Campus Connect - A community platform using React, Node.js and Supabase.

CERTIFICATIONS
AWS Certified Cloud Practitioner
`;

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected;
  if (ok) { pass++; console.log(`  PASS  ${label} => ${JSON.stringify(actual)}`); }
  else { fail++; console.log(`  FAIL  ${label} => got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); }
}

console.log('\n--- Test 1: realistic resume ---');
const r = heuristicFallbackParser(sample);
check('full_name', r.full_name, 'RAHUL SHARMA');
check('email', r.email, 'rahul.sharma2026@gmail.com');
check('phone', r.phone, (v) => /9876543210/.test(v));
check('cgpa', r.cgpa, 8.7);
check('summary', r.summary, (v) => typeof v === 'string' && v.includes('Computer Science undergraduate'));
check('skills count >= 8', r.skills.length, (v) => v >= 8);
check('has React', r.skills.includes('React'), true);
check('has Supabase', r.skills.includes('Supabase'), true);
check('has Machine Learning', r.skills.includes('Machine Learning'), true);
check('education has degree', r.education.length === 1 && /b\.?tech/i.test(r.education[0].degree), true);
check('education institution', r.education[0].institution, (v) => /Sri Venkateswara/i.test(v));
check('education year', r.education[0].year, '2026');
check('experience is [] (spec)', r.experience, (v) => Array.isArray(v) && v.length === 0);
check('projects is [] (spec)', r.projects, (v) => Array.isArray(v) && v.length === 0);
check('certifications is [] (spec)', r.certifications, (v) => Array.isArray(v) && v.length === 0);
check('schema keys match ParsedResume', Object.keys(r).sort().join(','),
  'certifications,cgpa,education,email,experience,full_name,phone,projects,skills,summary');

console.log('\n--- Test 2: messy/no-email resume (fallback edge cases) ---');
const messy = `Priya P.
Email: priya@example.com
Phone: 9123456780
Batch of 2024
Skills: Java, MySQL, Excel
CGPA 9.2`;
const r2 = heuristicFallbackParser(messy);
check('full_name (label stripped)', r2.full_name, 'Priya P.');
check('email', r2.email, 'priya@example.com');
check('phone (Indian mobile)', r2.phone, (v) => /9123456780/.test(v));
check('cgpa (no slash form)', r2.cgpa, 9.2);
check('grad year in education', r2.education.length === 0 ? '(none - no degree line)' : r2.education[0].year,
  (v) => v === '(none - no degree line)' || v === '2024');
check('experience is []', r2.experience, (v) => Array.isArray(v) && v.length === 0);

console.log('\n--- Test 3: empty/garbage text must not crash ---');
const r3 = heuristicFallbackParser('');
check('full_name', r3.full_name, '');
check('cgpa', r3.cgpa, 0);
check('skills', r3.skills, (v) => Array.isArray(v) && v.length === 0);
check('experience', r3.experience, (v) => Array.isArray(v) && v.length === 0);

const r4 = heuristicFallbackParser('!!! ### 12345 @@@ ... random gibberish only');
check('no crash on gibberish, name empty', r4.full_name, '');
check('cgpa 0', r4.cgpa, 0);

console.log('\n--- Test 4: header lines must NOT be picked as names ---');
const headerCases = [
  ['TECHNICAL SKILLS\nReact, Node.js\nsumit@gmail.com', ''],
  ['EDUCATIONAL QUALIFICATIONS\nB.Tech, 2026\nanu@yahoo.com', ''],
  ['PROFESSIONAL SUMMARY\nHardworking student\nraj@gmail.com', ''],
  ['POSITIONS OF RESPONSIBILITY\nClass Representative\nneha@gmail.com', ''],
];
for (const [txt, expected] of headerCases) {
  const res = heuristicFallbackParser(txt);
  check(`name from "${txt.split('\n')[0]}"`, res.full_name, expected);
}
// All-caps 2-word name must be ACCEPTED
const capsName = heuristicFallbackParser('RAHUL SHARMA\nrahul@gmail.com\n+91 9876543210');
check('all-caps 2-word name accepted', capsName.full_name, 'RAHUL SHARMA');
// Mixed-case name with title prefix
const titled = heuristicFallbackParser('Mr. Amit Kumar\namit@gmail.com\nCGPA: 8.0/10');
check('mixed-case name accepted', titled.full_name, 'Mr. Amit Kumar');

fs.unlinkSync(tmpTs);
fs.unlinkSync(tmpJs);

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
