/**
 * Extract likely tech/role skill keywords from plain resume text.
 * No PDF binary parsing required — paste text or .txt content.
 */
const KNOWN_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "react native",
  "node.js",
  "nodejs",
  "express",
  "mongodb",
  "mysql",
  "postgresql",
  "sql",
  "python",
  "django",
  "flask",
  "java",
  "spring",
  "c++",
  "c#",
  "html",
  "css",
  "sass",
  "tailwind",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "linux",
  "git",
  "rest",
  "graphql",
  "redux",
  "next.js",
  "vue",
  "angular",
  "selenium",
  "jest",
  "cypress",
  "figma",
  "ui/ux",
  "power bi",
  "excel",
  "machine learning",
  "tensorflow",
  "pandas",
  "numpy",
  "hadoop",
  "kafka",
  "redis",
  "firebase",
  "php",
  "laravel",
  "go",
  "golang",
  "ruby",
  "swift",
  "kotlin",
  "android",
  "ios",
  "devops",
  "ci/cd",
  "agile",
  "scrum",
  "communication",
  "leadership",
];

const DISPLAY = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  nodejs: "Node.js",
  "node.js": "Node.js",
  "next.js": "Next.js",
  "react native": "React Native",
  mongodb: "MongoDB",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  html: "HTML",
  css: "CSS",
  rest: "REST",
  aws: "AWS",
  "machine learning": "Machine Learning",
  "power bi": "Power BI",
  "ui/ux": "UI/UX",
  "ci/cd": "CI/CD",
  golang: "Go",
  graphql: "GraphQL",
};

const KNOWN_LOCATIONS = [
  "Bengaluru",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Mumbai",
  "Delhi",
  "Noida",
  "Gurugram",
  "Gurgaon",
  "Kolkata",
  "Mysuru",
  "Mysore",
  "Remote",
  "Kochi",
  "Jaipur",
  "Ahmedabad",
];

const LOCATION_LABEL = {
  bangalore: "Bengaluru",
  mysore: "Mysuru",
  gurgaon: "Gurugram",
};

const KNOWN_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Software Engineer",
  "Software Developer",
  "MERN Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Java Developer",
  "Python Developer",
  "Data Analyst",
  "DevOps Engineer",
  "QA Engineer",
  "UI/UX Designer",
  "Web Developer",
  "Mobile App Developer",
  "Machine Learning Engineer",
  "Business Analyst",
  "Intern",
  "Graduate Trainee",
];

function titleCaseName(value) {
  return String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 1) return word.toUpperCase();
      if (word === word.toUpperCase() && word.length > 1) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function looksLikeName(words) {
  if (words.length < 2 || words.length > 5) return false;
  return words.every((word) => /^[A-Za-z][A-Za-z.'-]{0,24}$/.test(word));
}

function extractName(text = "", fileName = "") {
  const labeled = String(text).match(
    /(?:^|\n)\s*(?:name|full name)\s*[:\-]\s*([A-Za-z][A-Za-z.'\-\s]{1,60})/i
  );
  if (labeled) {
    const words = labeled[1].split("\n")[0].trim().split(/\s+/);
    if (looksLikeName(words)) return titleCaseName(words.join(" "));
  }

  const head = String(text).slice(0, 500);
  const beforeContact = head.split(/@|\b(?:phone|mobile|email|contact)\b|\+?\d[\d\s-]{8,}/i)[0];
  const cleaned = beforeContact
    .replace(/[|•·,;/\\]+/g, " ")
    .replace(/[^A-Za-z\s.'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const skip = new Set([
    "resume",
    "curriculum",
    "vitae",
    "cv",
    "profile",
    "summary",
    "objective",
    "skills",
    "education",
    "experience",
    "projects",
    "git",
    "github",
    "gitlab",
    "linkedin",
    "portfolio",
    "leetcode",
  ]);
  const degrees = new Set([
    "mca",
    "bca",
    "btech",
    "mtech",
    "be",
    "bsc",
    "msc",
    "mba",
    "phd",
    "bcom",
    "mcom",
    "bengaluru",
    "bangalore",
    "mysuru",
    "mysore",
    "hyderabad",
    "chennai",
    "pune",
    "mumbai",
    "delhi",
  ]);
  const nameWords = [];
  for (const word of cleaned.split(" ")) {
    if (!word) continue;
    const lower = word.toLowerCase();
    if (skip.has(lower) || degrees.has(lower)) {
      if (nameWords.length) break;
      continue;
    }
    if (!/^[A-Za-z][A-Za-z.'-]{0,24}$/.test(word)) break;
    if (lower.length > 1 && nameWords.some((item) => item.toLowerCase() === lower)) break;
    nameWords.push(word);
    if (nameWords.length === 4) break;
  }
  if (looksLikeName(nameWords)) return titleCaseName(nameWords.join(" "));

  const fromFile = String(fileName || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\(\d+\)/g, " ")
    .replace(/resume|curriculum|vitae|\bcv\b/gi, " ")
    .split(/[^A-Za-z]+/)
    .filter((word) => word && word.length > 0 && !/^(pdf|docx|txt)$/i.test(word));
  if (looksLikeName(fromFile)) return titleCaseName(fromFile.join(" "));
  return "";
}

function extractEmail(text = "") {
  const raw = String(text).replace(/\s+/g, " ");
  const direct = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (direct) return direct[0].toLowerCase();

  const spaced = raw.match(
    /([A-Z0-9._%+-]+)\s*@\s*([A-Z0-9.-]+)\s*\.\s*([A-Z]{2,})/i
  );
  if (spaced) return `${spaced[1]}@${spaced[2]}.${spaced[3]}`.toLowerCase();
  return "";
}

function extractExperienceYears(text = "") {
  const hay = String(text);
  const labeled = hay.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp\b)/i
  );
  if (labeled) return Math.max(0, Math.round(Number(labeled[1])));

  const plain = hay.match(/(?:experience|exp)\s*[:\-]\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?/i);
  if (plain && Number(plain[1]) <= 40) return Math.max(0, Math.round(Number(plain[1])));

  if (/\b(fresher|entry[-\s]?level|pursuing|student|undergraduate|intern(?:ship)?)\b/i.test(hay)) {
    return 0;
  }
  return 0;
}

function extractRoles(text = "") {
  const hay = String(text);
  const found = [];
  const ordered = [...KNOWN_ROLES].sort((a, b) => b.length - a.length);
  for (const role of ordered) {
    const pattern = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const re = new RegExp(`(?:^|[^a-z])${pattern}(?:[^a-z]|$)`, "i");
    if (re.test(hay) && !found.some((item) => item.toLowerCase() === role.toLowerCase())) {
      found.push(role);
    }
  }
  const specific = found.filter((role) => role.toLowerCase() !== "intern");
  return (specific.length ? specific : found).slice(0, 3);
}

function parseResume(text = "", fileName = "") {
  const resumeText = String(text || "").replace(/\u0000/g, "").trim();
  const nameHint = typeof fileName === "string" ? fileName : fileName?.fileName || "";
  return {
    name: extractName(resumeText, nameHint),
    email: extractEmail(resumeText),
    skills: extractSkillsFromResume(resumeText),
    experienceYears: extractExperienceYears(resumeText),
    preferredLocations: extractLocations(resumeText),
    preferredRoles: extractRoles(resumeText),
    resumeText,
  };
}

function extractLocations(text = "") {
  const hay = String(text).toLowerCase();
  const found = [];
  for (const place of KNOWN_LOCATIONS) {
    const key = place.toLowerCase();
    const re = new RegExp(`(?:^|[^a-z])${key}(?:[^a-z]|$)`, "i");
    if (!re.test(hay)) continue;
    const label = LOCATION_LABEL[key] || place;
    if (!found.some((item) => item.toLowerCase() === label.toLowerCase())) found.push(label);
  }
  return found;
}

function extractSkillsFromResume(text = "") {
  const hay = String(text || "").toLowerCase();
  if (!hay.trim()) return [];

  const found = [];
  for (const skill of KNOWN_SKILLS) {
    const pattern = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const re = new RegExp(`(?:^|[^a-z0-9.+#])${pattern}(?:[^a-z0-9.+#]|$)`, "i");
    if (re.test(hay)) {
      const key = skill.toLowerCase();
      const label =
        DISPLAY[key] ||
        skill
          .split(" ")
          .map((w) => (w === "js" ? "JS" : w.charAt(0).toUpperCase() + w.slice(1)))
          .join(" ");
      if (!found.some((f) => f.toLowerCase() === label.toLowerCase())) {
        found.push(label);
      }
    }
  }
  return found;
}

module.exports = {
  extractSkillsFromResume,
  parseResume,
  KNOWN_SKILLS,
};
