/**
 * Phase 9 — confirm report docs exist for viva/report packaging.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..", "..");
const required = ["REPORT.md", "PPT_NOTES.md", "DEMO_CHECKLIST.md", "README.md"];

let ok = true;
for (const name of required) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) {
    console.error("Missing:", name);
    ok = false;
    continue;
  }
  const size = fs.statSync(file).size;
  console.log(`OK ${name} (${size} bytes)`);
  if (size < 500) {
    console.error("Too small:", name);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log("Phase 9 documentation package OK");
