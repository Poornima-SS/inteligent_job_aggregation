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

module.exports = { extractSkillsFromResume, KNOWN_SKILLS };
