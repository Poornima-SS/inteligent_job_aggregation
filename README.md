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
