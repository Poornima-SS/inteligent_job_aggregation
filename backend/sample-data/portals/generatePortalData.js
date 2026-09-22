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

function makeJobs(prefix, companies, count, linkBase) {
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
      id: `${prefix}-${i + 1}`,
      title: `${role}`,
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
      )}. Experience ${expMin}-${expMax} years preferred.`,
      applyUrl: `${linkBase}/${prefix}-${i + 1}`,
    };
  });
}

write(
  "naukri",
  makeJobs(
    "naukri",
    ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "HCL", "Tech Mahindra", "LTIMindtree"],
    25,
    "https://www.naukri.com/job-listings"
  )
);
write(
  "indeed",
  makeJobs(
    "indeed",
    ["Amazon", "IBM", "Capgemini", "Oracle", "Dell", "HP", "Cisco", "SAP"],
    22,
    "https://in.indeed.com/viewjob"
  )
);
write(
  "linkedin",
  makeJobs(
    "linkedin",
    ["Microsoft", "Google", "Flipkart", "Swiggy", "PhonePe", "Adobe", "Uber", "Netflix"],
    22,
    "https://www.linkedin.com/jobs/view"
  )
);
write(
  "apna",
  makeJobs(
    "apna",
    ["Reliance Retail", "Byju's", "Local Soft Pvt Ltd", "Urban Company", "BigBasket", "Zepto", "Blinkit", "Nykaa"],
    20,
    "https://apna.co/job"
  )
);
write(
  "private-company",
  makeJobs(
    "private",
    ["Zoho Corporation", "Freshworks", "Razorpay", "Postman", "Chargebee", "BrowserStack"],
    20,
    "https://careers.example.com/jobs"
  )
);
