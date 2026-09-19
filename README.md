# Intelligent Job Aggregation System Using Web Scraping

React + Node.js project for aggregating job listings, cleaning/deduplicating data, filtering, and recommendations.

## Current status

| Phase | Status |
|---|---|
| 0 Environment (React + Node + Mongo connect) | Done |
| 1 Models + seed data + basic jobs API | Done |
| 2 Auth | Next |

## Prerequisites

- Node.js LTS (v18+)
- npm
- MongoDB running locally (or Atlas URI in `.env`)

## Setup

### 1. Backend

```powershell
cd "D:\final year project\inteligent_job_aggregation\backend"
copy .env.example .env
npm install
npm run seed
npm run dev
```

### 2. Frontend (new terminal)

```powershell
cd "D:\final year project\inteligent_job_aggregation\frontend"
npm install
npm run dev
```

### 3. Open app

Visit: http://localhost:5173

## Phase 1 verify

| Check | URL |
|---|---|
| Health | http://localhost:5000/api/health |
| Jobs list | http://localhost:5000/api/jobs |
| Job stats | http://localhost:5000/api/jobs/stats |
| Search | http://localhost:5000/api/jobs?q=react&location=Bengaluru |

## Models

- `User` — profile, skills, saved jobs
- `Job` — listings with `contentHash` for dedupe
- `ScrapeLog` — scrape run history
- `Alert` — user job alerts

## Environment (`backend/.env`)

| Variable | Example |
|---|---|
| `PORT` | `5000` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/intelligent_job_aggregation` |
| `JWT_SECRET` | long random string |
| `CLIENT_URL` | `http://localhost:5173` |

## Next: Phase 2

Auth API (register, login, JWT) and profile endpoints.
