import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { scrapeApi, jobsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

const PORTAL_SOURCES = ["naukri", "indeed", "linkedin", "apna", "private-company"];

export default function AdminScrape() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [sources, setSources] = useState([]);
  const [selected, setSelected] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [schedule, setSchedule] = useState(null);

  const refresh = async () => {
    const [sourceData, logData, statsData, scheduleData] = await Promise.all([
      scrapeApi.sources(),
      scrapeApi.logs({ limit: 20 }),
      jobsApi.stats(),
      scrapeApi.schedule(),
    ]);
    setSources(sourceData.sources || []);
    setLogs(logData.logs || []);
    setStats(statsData);
    setSchedule(scheduleData);
    setSelected((prev) => {
      if (prev.length) return prev;
      return (sourceData.sources || []).map((s) => s.id);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh().catch((err) => setError(err.message || "Failed to load scrape panel"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const toggleSource = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectPortalsOnly = () => setSelected(PORTAL_SOURCES);
  const selectAll = () => setSelected(sources.map((s) => s.id));
  const clearSelected = () => setSelected([]);

  const run = async (sourcesToRun, label) => {
    if (!sourcesToRun?.length) {
      setError("Select at least one source before running.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    setStatusText(`Running ${label || sourcesToRun.join(", ")}...`);

    try {
      const outcome = await scrapeApi.run({
        sources: sourcesToRun,
        limit: 50,
      });
      setResult(outcome);
      setStatusText(
        `Finished at ${new Date().toLocaleTimeString()} — found ${
          outcome.summary?.jobsFound || 0
        }, saved ${outcome.summary?.jobsSaved || 0}`
      );
      await refresh();
    } catch (err) {
      setError(err.message || "Scrape failed. Is the backend running on port 5000?");
      setStatusText("");
    } finally {
      setBusy(false);
    }
  };

  const runScheduleNow = async () => {
    setBusy(true);
    setError("");
    setStatusText("Running scheduled sources now...");
    try {
      const outcome = await scrapeApi.runScheduleNow();
      setResult({
        status: outcome.status,
        summary: outcome.summary,
        results: outcome.results,
      });
      setSchedule({ schedule: outcome.schedule, latestScrape: null });
      setStatusText(
        `Scheduler run finished — found ${outcome.summary?.jobsFound || 0}, saved ${
          outcome.summary?.jobsSaved || 0
        }`
      );
      await refresh();
    } catch (err) {
      setError(err.message || "Scheduler run failed");
      setStatusText("");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="page">
        <p className="muted">Checking account...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Scrape jobs</h1>
          <p className="page-sub">
            Extract from Naukri, Indeed, LinkedIn, Apna and private company boards, then clean and
            store in MongoDB.
          </p>
        </div>
        <Link to="/jobs" className="btn btn-ghost btn-sm">
          View jobs
        </Link>
      </div>

      {stats && (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <p className="muted" style={{ margin: 0 }}>
            Database: <strong>{stats.active}</strong> active jobs · sources:{" "}
            {(stats.bySource || []).map((s) => `${s._id}(${s.count})`).join(", ") || "none"}
          </p>
        </div>
      )}

      {schedule?.schedule && (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Automatic scheduler (Phase 5)</p>
          <p className="muted" style={{ margin: 0 }}>
            Status: <strong>{schedule.schedule.enabled ? "enabled" : "disabled"}</strong>
            {" · "}
            cron: <code>{schedule.schedule.expression}</code>
            {" · "}
            sources: {(schedule.schedule.sources || []).join(", ")}
          </p>
          {schedule.latestScrape && (
            <p className="muted" style={{ margin: "0.4rem 0 0" }}>
              Latest log: {schedule.latestScrape.source} ({schedule.latestScrape.status}) at{" "}
              {new Date(
                schedule.latestScrape.finishedAt || schedule.latestScrape.startedAt
              ).toLocaleString()}
            </p>
          )}
          <div className="filter-actions">
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={busy}
              onClick={runScheduleNow}
            >
              Run scheduled sources now
            </button>
          </div>
        </div>
      )}

      <div className="scrape-actions sticky-actions">
        <div className="filter-actions" style={{ marginTop: 0 }}>
          <button
            className="btn btn-accent"
            type="button"
            disabled={busy || !selected.length}
            onClick={() => run(selected, "selected sources")}
          >
            {busy ? "Scraping..." : "Run selected"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={() => run(PORTAL_SOURCES, "portals + companies")}
          >
            Run portals + companies
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={() => run(["company-cheerio", "company-puppeteer"], "local HTML demos")}
          >
            Run local HTML demos
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={() => run(["remotive", "remoteok"], "public APIs")}
          >
            Run public APIs
          </button>
        </div>
        {(busy || statusText) && (
          <p className="muted" style={{ margin: "0.75rem 0 0" }}>
            {busy ? "Please wait — scrape in progress..." : statusText}
          </p>
        )}
        {error && <p className="alert alert-error" style={{ marginTop: "0.75rem" }}>{error}</p>}
        {result && (
          <div className="alert alert-ok" style={{ marginTop: "0.75rem" }}>
            Status: <strong>{result.status}</strong> · found {result.summary?.jobsFound || 0} ·
            saved {result.summary?.jobsSaved || 0}
            <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.1rem" }}>
              {(result.results || []).map((r) => (
                <li key={`${r.source}-${r.logId || r.status}`}>
                  {r.source}: {r.status} (found {r.jobsFound}, saved {r.jobsSaved})
                  {r.error ? ` — ${r.error}` : ""}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "0.75rem" }}>
              <Link to="/jobs" className="btn btn-primary btn-sm">
                Open Jobs list
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="panel form-grid" style={{ marginBottom: "1.25rem", marginTop: "1rem" }}>
        <div className="filter-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={selectPortalsOnly} disabled={busy}>
            Select portals only
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={selectAll} disabled={busy}>
            Select all
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={clearSelected} disabled={busy}>
            Clear
          </button>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          <strong>Portals:</strong> use <em>Run portals + companies</em> for Naukri, Indeed,
          LinkedIn, Apna (each job shows the portal name). <strong>Live APIs:</strong> Remotive +
          RemoteOK have direct apply links. Portal boards open a live search on that portal for the
          same role/location.
        </p>
        <div className="source-grid">
          {sources.map((source) => (
            <label key={source.id} className="source-item">
              <input
                type="checkbox"
                checked={selected.includes(source.id)}
                onChange={() => toggleSource(source.id)}
                disabled={busy}
              />
              <span>
                <strong>{source.label}</strong>
                {source.group ? <span className="muted"> · {source.group}</span> : null}
                <br />
                <span className="muted">{source.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
        Recent scrape logs
      </h2>
      <div className="job-list">
        {logs.length === 0 && <p className="muted">No scrape runs yet.</p>}
        {logs.map((log) => (
          <article key={log._id} className="job-item">
            <h2 style={{ fontSize: "1.05rem" }}>{log.source}</h2>
            <p className="job-meta">
              {log.status} · found {log.jobsFound} · saved {log.jobsSaved}
            </p>
            <p className="job-meta">
              {new Date(log.startedAt).toLocaleString()}
              {log.finishedAt ? ` → ${new Date(log.finishedAt).toLocaleString()}` : ""}
            </p>
            {log.error && <p className="muted">{log.error}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
