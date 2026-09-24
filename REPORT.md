# Intelligent Job Aggregation System Using Web Scraping

**Final Year Project Report Notes (Phase 9)**  
**Student:** Poornima S S · MCA  
**Stack:** React (Vite) · Node.js / Express · MongoDB · Cheerio · Puppeteer · node-cron

Use this document to align your synopsis, Phase-01 methodology slide, PPT, and viva answers.  
Copy sections into your formal report as needed.

---

## 1. Problem statement

Job openings are scattered across multiple portals (Naukri, Indeed, LinkedIn, Apna) and private company career pages. Listings differ in format, contain duplicates, and force candidates to search site by site. There is a need for a single system that:

1. Collects jobs from multiple sources automatically  
2. Cleans and normalizes fields (skills, location, salary, experience)  
3. Removes duplicates  
4. Lets users filter, get skill-based recommendations, and receive alerts  

---

## 2. Objectives

| # | Objective | How the project meets it |
|---|---|---|
| 1 | Scrape / aggregate multiple sources | Remotive & RemoteOK public APIs; Naukri/Indeed/LinkedIn/Apna/private-company extractors; Cheerio + Puppeteer demos |
| 2 | Clean, normalize, de-duplicate | `cleaner.js`, `dedupe.js`, `contentHash` |
| 3 | Unified UI with filters | Jobs page: keyword, location, skills, experience, salary, source, sort |
| 4 | Scheduled refresh | `node-cron` every 6 hours (configurable) |
| 5 | Personalized matching | Ranker (skills/location/role/experience/recency) + Alerts |

---

## 3. Software requirements (update synopsis if it still says Flask)

### Hardware (typical)

- PC with 8 GB+ RAM (Puppeteer needs Chromium)  
- Internet for public APIs and portal access  

### Software

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 18 + Vite + React Router | SPA: Jobs, Profile, Recommendations, Alerts, Scrape |
| Backend | Node.js + Express | REST API, auth, scrape orchestration |
| Database | MongoDB + Mongoose | Users, Jobs, ScrapeLogs, Alerts, Notifications |
| Static scrape | Cheerio + axios | Parse HTML fixtures / simple pages |
| Dynamic scrape | Puppeteer | JS-rendered career page demo |
| Auth | JWT + bcryptjs | Register / login / protected routes |
| Scheduler | node-cron | Periodic scrape |
| Ranking | Custom skill-overlap ranker | Recommendations + alert matching |
| Optional email | Nodemailer + SMTP | Alert emails when configured |

**Note for report:** Prefer stating **Node.js/Express** (not Flask) to match the implemented system.

---

## 4. System architecture

See also **[ARCHITECTURE.md](./ARCHITECTURE.md)** for Mermaid diagrams you can paste into PPT.

```
┌─────────────┐     HTTP/JSON      ┌──────────────────┐
│ React (Vite)│ ◄────────────────► │ Express REST API │
│  :5173      │    /api/* proxy    │     :5000        │
└─────────────┘                    └────────┬─────────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     ▼                      ▼                      ▼
              ┌────────────┐        ┌──────────────┐        ┌────────────┐
              │  MongoDB   │        │   Scrapers   │        │  Scheduler │
              │  Job/User  │◄───────│ Remotive/OK  │◄───────│ node-cron  │
              │ Alert/Log  │        │ Portals      │        └────────────┘
              └────────────┘        │ Cheerio/Pup  │
                     ▲              └──────┬───────┘
                     │                     │
                     │              ┌──────┴───────┐
                     └──────────────│ Clean/Dedupe │
                                    │ Rank/Notify  │
                                    └──────────────┘
```

### Data flow (methodology — maps to Phase-01 slide)

1. **Start**  
2. **User input** — search filters / skills / preferences / alert rules  
3. **Scraper** — manual button or cron  
4. **Scrape job listings** — APIs + portal extractors  
5. **Job DB check** — clean → contentHash upsert → skip near-duplicates  
6. **Filter & rank** — Jobs API + recommendations + alerts  
7. **Display / alert** — UI cards, match %, notifications → **End**

---

## 5. Modules implemented

| Module | Backend | Frontend |
|---|---|---|
| Auth | `/api/auth/*` | Login, Register, AuthContext |
| Profile | `/api/users/me`, extract-skills | Profile + resume skill extract |
| Jobs | `/api/jobs` filters, save | Jobs, JobDetail, Saved, FilterBar |
| Scraping | `/api/scrape/run`, logs | Admin Scrape page |
| Scheduler | cron + `/api/scrape/schedule` | Schedule panel on Scrape page |
| Recommendations | `/api/jobs/recommendations` | For you |
| Alerts | `/api/alerts/*` | Alerts + nav badge |
| Testing | `npm test`, `demo:fallback` | DEMO_CHECKLIST.md |

### Models

- **User** — name, email, passwordHash, skills, experience, preferred locations/roles, resumeText, savedJobs  
- **Job** — title, company, location, description, skills, experience, salary, employmentType, source, URLs, contentHash, postedAt, scrapedAt  
- **ScrapeLog** — source, timing, jobsFound/Saved, status, error  
- **Alert** — keywords, location, skills, minMatchScore, enabled  
- **Notification** — in-app alert hits (user + job + score)

---

## 6. Scraping approach (viva safety)

| Source | Method | Notes for viva |
|---|---|---|
| Remotive | Public JSON API | Live apply links |
| RemoteOK | Public JSON API | Live apply links |
| Naukri / Indeed / LinkedIn / Apna | Structured extractors + fixtures | Live full-site HTML is often blocked (ToS / anti-bot); outbound links open **live search** on that portal |
| Private companies | Career URL mapping + fixtures | Opens real careers pages (e.g. Freshworks, Zoho) |
| Local HTML | Cheerio + Puppeteer | Demonstrates static vs JS rendering |

**Ethical stance (write this in the report):**  
Rate-limit requests, store only public job fields, do not bypass logins/CAPTCHAs, prefer public APIs and documented demo fixtures when portals block automated access.

---

## 7. Recommendation formula

\[
score = 0.45\cdot skills + 0.20\cdot location + 0.15\cdot role + 0.10\cdot experience + 0.10\cdot recency
\]

Each component is 0–100. Results sorted descending on **For you**.

---

## 8. API map (summary)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | JWT |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/users/me/extract-skills` | Resume → skills |
| GET | `/api/jobs` | Search + filters |
| GET | `/api/jobs/:id` | Detail |
| GET | `/api/jobs/recommendations` | Ranked list |
| POST/DELETE | `/api/jobs/:id/save` | Save / unsave |
| POST | `/api/scrape/run` | Trigger scrapers |
| GET | `/api/scrape/logs` | History |
| GET/POST | `/api/scrape/schedule` | Cron status / run-now |
| CRUD | `/api/alerts` | Job alerts |
| GET | `/api/alerts/notifications` | In-app notifications |
| GET | `/api/health` | Status + phase |

---

## 9. Testing

| Type | Command / artifact |
|---|---|
| Unit tests | `cd backend && npm test` (cleaner, dedupe, ranker, resume parser) |
| Manual viva | `DEMO_CHECKLIST.md` |
| Offline fallback | `npm run demo:fallback` |

---

## 10. Limitations

1. **Anti-bot / ToS** — Major portals often block headless browsers; live deep-link scraping of Naukri/Indeed/LinkedIn is not reliable or always permitted.  
2. **HTML churn** — Portal layouts change; selectors/fixtures need maintenance.  
3. **Fixture vs live accuracy** — Portal extractors demonstrate the pipeline; Remotive/RemoteOK provide the most accurate live apply URLs.  
4. **Email alerts** — Require correct SMTP configuration; default is in-app notifications.  
5. **No ML spam filter** — Ranking is rule-based skill overlap, not a trained classifier.  
6. **Scale** — Designed for project/demo volume, not production crawl farms.

---

## 11. Future work

1. More public/legal job feeds (RSS, official APIs)  
2. ML-based spam / fake-job filtering (cite related literature if required)  
3. PDF resume upload (`pdf-parse`) beyond pasted text  
4. Mobile-responsive PWA or native app  
5. Admin dashboard analytics (jobs per source over time)  
6. OAuth login (Google/GitHub)

---

## 12. Screenshot guide (for PPT / report)

Capture these screens while the app is running:

| # | Screen | Path | What to highlight |
|---|---|---|---|
| 1 | Home | `/` | Brand, problem, how-it-works, stats |
| 2 | Register/Login | `/register`, `/login` | Auth |
| 3 | Profile | `/profile` | Skills + extract from resume |
| 4 | Scrape | `/scrape` | Run portals / APIs, logs, scheduler |
| 5 | Jobs list | `/jobs` | Filters, portal name badge, Open on … |
| 6 | Job detail | `/jobs/:id` | Description, apply link |
| 7 | Recommendations | `/recommendations` | Match % + breakdown |
| 8 | Alerts | `/alerts` | Create, preview, notifications, badge |
| 9 | Saved | `/saved` | Bookmarks |
| 10 | Tests terminal | — | `npm test` all passing |

---

## 13. Suggested PPT slide outline (10–12 slides)

1. Title — Intelligent Job Aggregation System Using Web Scraping  
2. Problem & motivation  
3. Objectives  
4. Literature / research gap (duplicates, multi-source, JS pages)  
5. System architecture diagram  
6. Methodology flowchart (7 steps above)  
7. Tech stack  
8. Scraping pipeline (clean → dedupe → MongoDB)  
9. Recommendations & alerts  
10. Implementation screenshots (2–3 slides)  
11. Testing & results  
12. Limitations, future work, conclusion  

---

## 14. Conclusion (sample paragraph)

The Intelligent Job Aggregation System successfully demonstrates end-to-end aggregation of job listings using a React frontend and Node.js/Express backend with MongoDB. The pipeline scrapes or extracts multi-source data, cleans and de-duplicates records, supports filtered search, skill-based recommendations, scheduled updates, and in-app job alerts. Public APIs provide live apply links, while portal extractors illustrate ethical, maintainable scraping patterns suitable for academic evaluation and viva demonstration.

---

*Phase 9 deliverable — documentation for report and PPT alignment. Implementation code lives under `inteligent_job_aggregation/`.*
