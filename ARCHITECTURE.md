# System architecture & methodology (Phase 10)

Copy these diagrams into your report or PPT (GitHub, VS Code, or [mermaid.live](https://mermaid.live) can render them).

---

## 1. High-level architecture

```mermaid
flowchart LR
  User[User Browser] --> FE[React Vite :5173]
  FE -->|/api proxy| API[Express API :5000]
  API --> DB[(MongoDB)]
  API --> Scrapers[Scrapers]
  Scrapers --> Clean[Cleaner]
  Clean --> Dedupe[Dedupe / contentHash]
  Dedupe --> DB
  Cron[node-cron] --> Scrapers
  API --> Ranker[Ranker]
  API --> Notify[Notifier / Alerts]
  Ranker --> DB
  Notify --> DB
```

---

## 2. Methodology (Phase-01 style)

```mermaid
flowchart TD
  A[Start] --> B[User input: search / skills / alerts]
  B --> C[Scraper: API or portal extractor]
  C --> D[Scrape job listings]
  D --> E[Clean + normalize fields]
  E --> F[Dedupe + upsert MongoDB]
  F --> G[Filter and rank]
  G --> H[Display UI / send alert]
  H --> I[End]
```

---

## 3. Scraping pipeline detail

```mermaid
sequenceDiagram
  participant Admin as Scrape UI / Cron
  participant API as Express
  participant S as Scraper
  participant C as Cleaner
  participant D as Dedupe
  participant M as MongoDB
  participant N as Notifier

  Admin->>API: POST /api/scrape/run
  API->>S: run selected sources
  S-->>API: raw jobs
  API->>C: cleanJob()
  C-->>API: normalized jobs
  API->>D: upsertJobs()
  D->>M: insert / update by contentHash
  API->>N: processAlerts(since)
  N->>M: create Notifications
  API-->>Admin: jobsFound / jobsSaved
```

---

## 4. Recommendation scoring

```mermaid
pie title Match score weights
  "Skills 45%" : 45
  "Location 20%" : 20
  "Role 15%" : 15
  "Experience 10%" : 10
  "Recency 10%" : 10
```

---

## 5. Folder map (implementation)

```
inteligent_job_aggregation/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── models/          User, Job, ScrapeLog, Alert, Notification
│   │   ├── scrapers/        remotive, remoteok, portals, cheerio, puppeteer
│   │   ├── services/        cleaner, dedupe, ranker, notifier, resumeParser
│   │   ├── routes/          auth, users, jobs, scrape, alerts
│   │   ├── jobs/cron.js     scheduler
│   │   └── scripts/         seed, import, demo fallback, verify
│   ├── tests/               unit tests (Phase 8)
│   └── sample-data/         jobs.json + portal fixtures
├── frontend/
│   └── src/pages/           Home, Jobs, Profile, Scrape, Alerts, Recommendations...
├── REPORT.md                report text (Phase 9)
├── PPT_NOTES.md             viva slides (Phase 9)
├── DEMO_CHECKLIST.md        live demo (Phase 8)
├── ARCHITECTURE.md          this file (Phase 10)
└── SUBMISSION.md            handoff checklist (Phase 10)
```

---

## 6. Tech stack summary (for SRS table)

| Layer | Choice |
|---|---|
| Presentation | React + Vite |
| Application | Node.js + Express |
| Data | MongoDB + Mongoose |
| Scraping | Cheerio, Puppeteer, public job APIs |
| Auth | JWT + bcrypt |
| Scheduling | node-cron |
| Alerts | In-app notifications (+ optional SMTP) |
