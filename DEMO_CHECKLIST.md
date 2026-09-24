# Phase 8 — Manual demo / viva checklist

Use this during project demo (≈5 minutes). Backend on `:5000`, frontend on `:5173`.

## Before you start

- [ ] MongoDB is running
- [ ] `cd backend` → `npm run dev` (look for `[scheduler] Enabled`)
- [ ] `cd frontend` → `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Health: http://localhost:5000/api/health → `"phase": 10`

If live scrape fails in viva:

```powershell
cd backend
npm run demo:fallback
```

## Demo script

1. **Home** — Show problem statement + how-it-works + live stats.
2. **Register / Login** — Use your account (or create one).
3. **Profile** — Set skills `React, Node.js, MongoDB`, location `Bengaluru`.  
   Optional: paste resume text → **Extract skills from resume** → Save.
4. **Scrape** — Click **Run portals + companies** and/or **Run public APIs**.  
   Show jobs found / saved in the result panel.
5. **Jobs** — Filter by skill or location; open a card; click **Open on …** (portal name visible).
6. **For you** — Show ranked matches + match % breakdown.
7. **Alerts** — Create alert (keywords `Developer`, skills `React`) → **Preview matches** → **Create alert** → **Check matches now**.  
   Show notification + nav badge.
8. **Saved** — Save one job from Jobs, open Saved list.
9. **Dedupe talking point** — Same title+company+location gets one `contentHash`; re-scrape does not flood duplicates.

## Automated tests

```powershell
cd backend
npm test
```

Expected: all tests pass (cleaner, dedupe, ranker, resume parser).

## Optional email alerts

Only if SMTP is configured in `.env` (`SMTP_HOST=smtp.gmail.com`, etc.).  
Otherwise in-app notifications are enough for viva.

## Troubleshooting

| Issue | Fix |
|---|---|
| No jobs | `npm run import:portals` and/or `npm run import:real` / `npm run demo:fallback` |
| Port 5000 in use | Stop old Node process, restart `npm run dev` |
| Buttons on Alerts do nothing | Hard refresh (`Ctrl+Shift+R`); confirm backend is up |
| Apply link 404 | Prefer Remotive/RemoteOK direct links; portal cards open live search on that portal |
