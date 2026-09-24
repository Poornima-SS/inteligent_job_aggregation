# Project submission checklist (Phase 10)

Final handoff package for college submission / viva. Mark each item when done.

## A. Code & run

- [ ] Backend starts: `cd backend` → `npm run dev`
- [ ] Frontend starts: `cd frontend` → `npm run dev`
- [ ] http://localhost:5173 loads Home
- [ ] http://localhost:5000/api/health returns `"phase": 10`, `dbConnected: true`
- [ ] MongoDB connected (local or Atlas URI in `backend/.env`)
- [ ] `.env` exists but **is not** committed with real passwords (use `.env.example`)

## B. Features to demonstrate

- [ ] Register / Login
- [ ] Profile skills + optional resume extract
- [ ] Scrape portals and/or public APIs
- [ ] Jobs filter + portal name on cards + Open link
- [ ] Recommendations (For you)
- [ ] Alerts create / preview / notifications badge
- [ ] Saved jobs
- [ ] Scheduler visible on Scrape page

## C. Tests & fallback

- [ ] `cd backend` → `npm test` (all pass)
- [ ] `npm run verify:final` (docs + tests)
- [ ] Know `npm run demo:fallback` if live scrape fails

## D. Documents to submit / print

| Document | File |
|---|---|
| Report body notes | `REPORT.md` |
| Architecture diagrams | `ARCHITECTURE.md` |
| PPT speaker notes | `PPT_NOTES.md` |
| Demo script | `DEMO_CHECKLIST.md` |
| Project README | `README.md` |
| This checklist | `SUBMISSION.md` |

- [ ] Synopsis updated: **React + Node.js/Express + MongoDB** (not Flask)
- [ ] Screenshots captured (see REPORT.md §12)
- [ ] PPT built from PPT_NOTES + ARCHITECTURE diagrams
- [ ] Limitations & future work included in report

## E. Git / zip package (if required)

Suggested zip contents:

```
inteligent_job_aggregation/
  backend/          (node_modules optional — or document npm install)
  frontend/         (node_modules optional)
  *.md docs
```

Exclude:

- `node_modules/` (reinstall with `npm install`)
- `.env` secrets (ship `.env.example` only)
- Puppeteer cache if size-limited (re-download on install)

## F. One-line project abstract (copy to synopsis)

> An Intelligent Job Aggregation System that scrapes and aggregates openings from multiple sources, cleans and de-duplicates listings in MongoDB, and provides a React UI for filtering, skill-based recommendations, scheduled refresh, and job alerts using Node.js/Express, Cheerio, and Puppeteer.

## G. Final verify command

```powershell
cd "D:\final year project\inteligent_job_aggregation\backend"
npm run verify:final
```

When this passes and the demo checklist works, the project is **submission-ready**.
