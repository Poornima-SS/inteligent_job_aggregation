/**
 * Phase 10 — final project verification (docs + unit tests).
 * Optionally checks API health if server is running.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const root = path.join(__dirname, "..", "..", "..");
const backend = path.join(__dirname, "..", "..");

const docs = [
  "README.md",
  "REPORT.md",
  "PPT_NOTES.md",
  "DEMO_CHECKLIST.md",
  "ARCHITECTURE.md",
  "SUBMISSION.md",
];

function checkDocs() {
  console.log("\n== Documentation ==");
  let ok = true;
  for (const name of docs) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) {
      console.error(`FAIL missing ${name}`);
      ok = false;
      continue;
    }
    const size = fs.statSync(file).size;
    console.log(`OK ${name} (${size} bytes)`);
  }
  return ok;
}

function checkSourceFolders() {
  console.log("\n== Source folders ==");
  const required = [
    "backend/src/scrapers",
    "backend/src/services",
    "backend/src/models",
    "backend/tests",
    "frontend/src/pages",
    "frontend/src/components",
  ];
  let ok = true;
  for (const rel of required) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) {
      console.error(`FAIL missing ${rel}`);
      ok = false;
    } else {
      console.log(`OK ${rel}`);
    }
  }
  return ok;
}

function runTests() {
  console.log("\n== Unit tests ==");
  const result = spawnSync("npm", ["test"], {
    cwd: backend,
    encoding: "utf8",
    shell: true,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error("FAIL npm test");
    return false;
  }
  console.log("OK npm test");
  return true;
}

function checkHealth() {
  return new Promise((resolve) => {
    console.log("\n== API health (optional) ==");
    const req = http.get("http://127.0.0.1:5000/api/health", (res) => {
      let body = "";
      res.on("data", (c) => {
        body += c;
      });
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          console.log("OK health", JSON.stringify(data));
          if (data.phase < 10) {
            console.warn(`WARN health phase is ${data.phase} (restart backend for phase 10)`);
          }
          resolve(true);
        } catch (err) {
          console.warn("WARN could not parse health:", err.message);
          resolve(true);
        }
      });
    });
    req.on("error", () => {
      console.warn("WARN backend not running on :5000 (start with npm run dev) — skipped");
      resolve(true);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      console.warn("WARN health timeout — skipped");
      resolve(true);
    });
  });
}

async function main() {
  console.log("Phase 10 final verification");
  const docsOk = checkDocs();
  const foldersOk = checkSourceFolders();
  const testsOk = runTests();
  await checkHealth();

  if (!docsOk || !foldersOk || !testsOk) {
    console.error("\nVERIFY FAILED");
    process.exit(1);
  }
  console.log("\nVERIFY PASSED — project submission-ready (Phase 10)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
