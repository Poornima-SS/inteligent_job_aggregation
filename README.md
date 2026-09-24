# Intelligent Job Aggregation System Using Web Scraping

React + Node.js project for aggregating job listings, cleaning/deduplicating data, filtering, recommendations, and job alerts.

## Current status

| Phase | Status |
|---|---|
| 0 Environment | Done |
| 1 Models + seed + jobs API | Done |
| 2 Auth | Done |
| 3 Filters + save jobs | Done |
| 4 Scraping pipeline | Done |
| 5 Scheduler + recommendations | Done |
| 6 Alerts | Done |
| 7 Frontend polish | Done |
| 8 Testing & demo | Done |
| 9 Report / PPT docs | Done |
| 10 Final packaging | Done |

**Project status: complete (Phases 0–10).**


## Setup

### Backend

```powershell
cd "D:\final year project\inteligent_job_aggregation\backend"
npm install
npm run seed
npm run dev
```

### Frontend

```powershell
cd "D:\final year project\inteligent_job_aggregation\frontend"
npm install
npm run dev
```

Open: http://localhost:5173

## Phase 5

### Scheduler (`node-cron`)

Env vars in `backend/.env`:

| Variable | Default | Meaning |
|---|---|---|
| `CRON_ENABLED` | `true` | Turn scheduler on/off |
| `CRON_EXPRESSION` | `0 */6 * * *` | Every 6 hours |
| `CRON_SOURCES` | naukri,indeed,linkedin,apna,private-company | Sources to auto-scrape |

APIs:

- `GET /api/scrape/schedule`
- `POST /api/scrape/schedule/run-now`

### Recommendations

- `GET /api/jobs/recommendations` (auth)
- Scores skills (45%), location (20%), role (15%), experience (10%), recency (10%)
- UI: `/recommendations` (“For you” in nav)

Jobs page also shows **Last scrape update** from the latest `ScrapeLog`.

## Phase 6 — Alerts

Create keyword/location/skill alerts. After each scrape (and via **Check matches now**), matching jobs become in-app notifications. Optional email if SMTP env vars are set.

### APIs (auth required)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/alerts` | List your alerts |
| POST | `/api/alerts` | Create alert |
| PUT | `/api/alerts/:id` | Update alert |
| DELETE | `/api/alerts/:id` | Delete alert |
| POST | `/api/alerts/preview` | Preview matching jobs |
| POST | `/api/alerts/run-now` | Evaluate alerts now |
| GET | `/api/alerts/notifications` | List notifications |
| GET | `/api/alerts/notifications/unread-count` | Badge count |
| POST | `/api/alerts/notifications/:id/read` | Mark one read |
| POST | `/api/alerts/notifications/read-all` | Mark all read |

### UI

- Nav → **Alerts** (badge shows unread count)
- Page: `/alerts`

### Optional email (`backend/.env`)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

Without SMTP, alerts still work as in-app notifications.

## Phase 7 — Frontend polish

- Home: problem statement, how-it-works, live stats, search bar, CTAs
- Shared UI: `LoadingState`, `EmptyState`, `SkillTags`, `SearchBar`, `Footer`, `NotFound`
- Responsive navbar (mobile Menu toggle)
- Profile: **Extract skills from resume** (`POST /api/users/me/extract-skills`)
- Loading / empty states on Jobs, Saved, Recommendations
- Vite proxy `/api` → `http://localhost:5000` (unchanged)

### Resume skill extract

Paste resume text on Profile → **Extract skills from resume** → review tags → **Save profile**.

## Phase 8 — Testing & demo

### Automated tests (Node built-in test runner)

```powershell
cd backend
npm test
```

Covers: cleaner (HTML/location/salary/experience), dedupe/hash, ranker, resume skill extract.

### Viva fallback (if live scrape fails)

```powershell
cd backend
npm run demo:fallback
```

Loads `sample-data/jobs.json` so Jobs UI still works offline. Use `--replace-all` only if you want a clean demo DB.

### Checklist

See [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md) for the 5-minute viva script.

## Phase 9 — Report / PPT alignment

Documentation for your formal report and presentation (not new app features):

| File | Purpose |
|---|---|
| [REPORT.md](./REPORT.md) | Problem, objectives, SRS tech stack, architecture, methodology, APIs, limitations, future work, screenshot guide, conclusion |
| [PPT_NOTES.md](./PPT_NOTES.md) | Slide talking points + viva Q&A |
| [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md) | Live demo script |

**Update your synopsis slide** if it still says Flask → use **Node.js / Express + React + MongoDB**.

## Phase 10 — Final packaging

| File / command | Purpose |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Mermaid architecture + methodology diagrams for PPT/report |
| [SUBMISSION.md](./SUBMISSION.md) | College submission / viva handoff checklist |
| `npm run verify:final` | Docs + folders + unit tests (+ optional health check) |

```powershell
cd backend
npm run verify:final
```
