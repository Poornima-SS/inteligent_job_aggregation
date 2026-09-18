# Intelligent Job Aggregation System Using Web Scraping

React + Node.js project for aggregating job listings, cleaning/deduplicating data, filtering, and recommendations.

## Phase 0 status

Scaffold is ready:

- `backend/` — Express API on port **5000**
- `frontend/` — React + Vite on port **5173**
- Env template: `backend/.env.example`
- MongoDB connection is attempted at startup (optional for Phase 0)

## Prerequisites

- Node.js LTS (v18+)
- npm
- MongoDB local **or** MongoDB Atlas URI (needed from Phase 1 onward)

## Setup

### 1. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

### 3. Open app

Visit: http://localhost:5173

## Verify Phase 0

| Check | URL / action |
|---|---|
| Backend message | http://localhost:5000/api/message |
| Health | http://localhost:5000/api/health |
| Frontend UI | http://localhost:5173 (green backend status) |

## Environment variables (`backend/.env`)

| Variable | Example |
|---|---|
| `PORT` | `5000` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/intelligent_job_aggregation` |
| `JWT_SECRET` | long random string |
| `CLIENT_URL` | `http://localhost:5173` |

## Next: Phase 1

Database models (`User`, `Job`, `ScrapeLog`, `Alert`) and seed data.
