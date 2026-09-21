# Intelligent Job Aggregation System Using Web Scraping

React + Node.js project for aggregating job listings, cleaning/deduplicating data, filtering, and recommendations.

## Current status

| Phase | Status |
|---|---|
| 0 Environment | Done |
| 1 Models + seed + jobs API | Done |
| 2 Auth (register / login / JWT / profile) | Done |
| 3 Filters + pagination + save jobs | Done |
| 4 Scraping pipeline | Next |

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

## Phase 3 API

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/jobs?q=&location=&skills=&employmentType=&experienceMax=&salaryMin=&source=&sort=&page=&limit=` | Optional |
| GET | `/api/jobs/saved` | Bearer |
| POST | `/api/jobs/:id/save` | Bearer |
| DELETE | `/api/jobs/:id/save` | Bearer |

Sort options: `newest`, `oldest`, `salary_high`, `salary_low`, `title`

## Frontend routes

- `/jobs` — filters, pagination, save
- `/jobs/:id` — detail + save/unsave
- `/saved` — saved jobs list (login required)

## Next: Phase 4

Scraping pipeline (Cheerio/Puppeteer), cleaner, dedupe, scrape logs.
