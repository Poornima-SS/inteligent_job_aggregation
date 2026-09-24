# PPT talking points (Phase 9)

Short speaker notes you can paste under each slide.

## Slide: Title
“This project aggregates job openings from multiple sources into one React + Node.js system with cleaning, deduplication, recommendations, and alerts.”

## Slide: Problem
“Candidates waste time checking Naukri, Indeed, LinkedIn, and company sites separately. Formats differ and duplicates appear.”

## Slide: Objectives
“Scrape/aggregate → clean & dedupe → filter in one UI → schedule refresh → recommend & alert.”

## Slide: Architecture
“Browser talks to Express API; scrapers feed MongoDB after clean/dedupe; cron refreshes; ranker and notifier personalize results.”

## Slide: Methodology
“User input → scraper → listings → DB upsert with contentHash → filter/rank → display or alert.”

## Slide: Scraping
“Remotive and RemoteOK are live public APIs. Portal modules show Naukri/Indeed/LinkedIn/Apna extraction. We respect ToS: no CAPTCHA bypass; portals open live search links.”

## Slide: Recommendations
“Weighted score: skills 45%, location 20%, role 15%, experience 10%, recency 10%.”

## Slide: Alerts
“User saves rules; after scrape or Check now, matching jobs become notifications with a nav badge.”

## Slide: Testing
“Fifteen automated unit tests for cleaner, dedupe, ranker, resume parser. Demo fallback seeds sample JSON if network scrape fails.”

## Slide: Limitations & future
“Anti-bot limits live HTML scraping. Future: more legal feeds, PDF resume parse, ML spam filter, mobile app.”

## Viva Q&A quick answers

**Q: Why Node instead of Flask?**  
A: Synopsis updated to React + Node/Express for a single JavaScript stack and strong scraping libraries (Cheerio, Puppeteer).

**Q: How do you avoid duplicates?**  
A: SHA-256 `contentHash` of normalized title+company+location, plus near-duplicate similarity check in batch.

**Q: Is LinkedIn scraped live?**  
A: We demonstrate LinkedIn-style extraction and open live LinkedIn job search URLs. Full automated LinkedIn scrapes require login and violate ToS — not used.

**Q: What if scrape fails in viva?**  
A: Run `npm run demo:fallback` to load `sample-data/jobs.json`.
