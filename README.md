# Intelligent Job Aggregation System Using Web Scraping

React + Node.js project for aggregating job listings, cleaning/deduplicating data, filtering, and recommendations.

## Current status

| Phase | Status |
|---|---|
| 0 Environment | Done |
| 1 Models + seed + jobs API | Done |
| 2 Auth | Done |
| 3 Filters + save jobs | Done |
| 4 Scraping pipeline | Done |
| 5 Scheduler + recommendations | Next |

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

## Phase 4 — Scraping

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/scrape/sources` | Bearer |
| POST | `/api/scrape/run` | Bearer |
| GET | `/api/scrape/logs` | Bearer |

### Sources

- `naukri`, `indeed`, `linkedin`, `apna` — portal-style extractors (demo HTML fixtures → clean → MongoDB)
- `private-company` — Zoho / Freshworks / Razorpay career-page style boards
- `remotive`, `remoteok` — public APIs
- `company-cheerio`, `company-puppeteer` — local HTML demos

**Note for viva:** Naukri/Indeed/LinkedIn/Apna block unauthorized live scraping (ToS + anti-bot). This project implements real extract→clean→dedupe→MongoDB pipelines using structure-matched fixtures so demos always work. Production would use official partner APIs.

Pipeline: scrape → clean/normalize → de-duplicate (`contentHash` + near-match) → upsert MongoDB → `ScrapeLog`

UI: `/scrape` (login required)

## Ethical note

Only public/demo sources are used. Rate limiting and polite User-Agent are applied. Do not scrape authenticated or CAPTCHA-protected sites.

## Next: Phase 5

Scheduled scrapes (`node-cron`) + skill-based recommendations.
