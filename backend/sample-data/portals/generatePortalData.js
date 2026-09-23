const fs = require("fs");
const path = require("path");

function write(name, jobs) {
  const file = path.join(__dirname, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(jobs, null, 2));
  console.log(name, jobs.length);
}

const cities = [
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Mumbai",
  "Mysuru",
  "Delhi",
  "Remote",
];

const skillsPool = [
  ["React", "JavaScript", "HTML", "CSS"],
  ["Node.js", "Express", "MongoDB", "REST"],
  ["Java", "Spring", "SQL"],
  ["Python", "Django", "PostgreSQL"],
  ["Selenium", "Testing", "API Testing"],
  ["AWS", "Docker", "Linux"],
  ["Figma", "UI Design", "Prototyping"],
  ["SQL", "Excel", "Power BI"],
];

const COMPANY_CAREERS = {
  "zoho corporation": "https://www.zoho.com/careers/",
  freshworks: "https://www.freshworks.com/company/careers/",
  razorpay: "https://razorpay.com/jobs/",
  postman: "https://www.postman.com/company/careers/",
  chargebee: "https://www.chargebee.com/careers/",
  browserstack: "https://www.browserstack.com/careers",
};

function slug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function portalSearchUrl(portal, title, company, location) {
  const q = encodeURIComponent(`${title} ${company}`.trim());
  const titleOnly = encodeURIComponent(title);
  const loc = encodeURIComponent(location === "Remote" ? "India" : location);
  const roleSlug = slug(title) || "software-engineer";
  const citySlug = slug(location === "Remote" ? "india" : location);

  switch (portal) {
    case "naukri":
      return `https://www.naukri.com/${roleSlug}-jobs-in-${citySlug}`;
    case "indeed":
      return `https://in.indeed.com/jobs?q=${titleOnly}&l=${loc}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`;
    case "apna":
      return `https://apna.co/jobs?q=${titleOnly}`;
    case "private-company": {
      const key = String(company).toLowerCase();
      for (const [name, url] of Object.entries(COMPANY_CAREERS)) {
        if (key.includes(name)) return url;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(`${company} careers jobs`)}`;
    }
    default:
      return `https://www.google.com/search?q=${q}+jobs`;
  }
}

function makeJobs(portal, companies, count) {
  const roles = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "QA Engineer",
    "Data Analyst",
    "DevOps Engineer",
    "Java Developer",
    "React Developer",
    "Node.js Developer",
    "Python Developer",
    "Mobile App Developer",
    "UI/UX Designer",
    "Business Analyst",
    "Cloud Engineer",
    "Support Engineer",
    "Internship - Web Development",
    "ML Engineer",
    "Security Analyst",
    "Product Analyst",
    "SDE Intern",
    "Automation Tester",
    "Database Developer",
    "API Developer",
    "Graduate Trainee",
  ];

  return Array.from({ length: count }, (_, i) => {
    const role = roles[i % roles.length];
    const company = companies[i % companies.length];
    const location = cities[i % cities.length];
    const skills = skillsPool[i % skillsPool.length];
    const expMin = i % 5 === 0 ? 0 : (i % 4) + 1;
    const expMax = expMin + 2;
    const salaryMin = 300000 + (i % 10) * 100000;
    const salaryMax = salaryMin + 400000;
    const employmentType =
      role.toLowerCase().includes("intern") || role.toLowerCase().includes("trainee")
        ? "internship"
        : location === "Remote"
          ? "remote"
          : "full-time";

    return {
      id: `${portal}-${i + 1}`,
      title: role,
      company,
      location,
      skills,
      experienceMin: expMin,
      experienceMax: expMax,
      salaryMin: employmentType === "internship" ? 10000 + (i % 5) * 2000 : salaryMin,
      salaryMax: employmentType === "internship" ? 25000 + (i % 5) * 2000 : salaryMax,
      salaryCurrency: "INR",
      employmentType,
      description: `${role} at ${company} in ${location}. Work with ${skills.join(
        ", "
      )}. Experience ${expMin}-${expMax} years preferred. Source portal: ${portal}.`,
      portal,
      applyUrl: portalSearchUrl(portal, role, company, location),
    };
  });
}

write(
  "naukri",
  makeJobs("naukri", ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "HCL", "Tech Mahindra", "LTIMindtree"], 25)
);
write(
  "indeed",
  makeJobs("indeed", ["Amazon", "IBM", "Capgemini", "Oracle", "Dell", "HP", "Cisco", "SAP"], 22)
);
write(
  "linkedin",
  makeJobs("linkedin", ["Microsoft", "Google", "Flipkart", "Swiggy", "PhonePe", "Adobe", "Uber", "Netflix"], 22)
);
write(
  "apna",
  makeJobs("apna", ["Reliance Retail", "Byju's", "Local Soft Pvt Ltd", "Urban Company", "BigBasket", "Zepto", "Blinkit", "Nykaa"], 20)
);
write(
  "private-company",
  makeJobs("private-company", ["Zoho Corporation", "Freshworks", "Razorpay", "Postman", "Chargebee", "BrowserStack"], 20)
);
