import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jobsApi } from "../api/client";
import SearchBar from "../components/SearchBar";
import { getSourceLabel } from "../utils/jobLinks";

const STEPS = [
  {
    title: "Scrape",
    text: "Pull listings from Naukri, Indeed, LinkedIn, Apna, Remotive, and RemoteOK.",
  },
  {
    title: "Clean & dedupe",
    text: "Normalize skills, salary, and location; skip duplicate postings.",
  },
  {
    title: "Match & alert",
    text: "Rank by your skills and notify you when new roles fit.",
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
    jobsApi
      .stats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-brand">Intelligent Job Aggregation</h1>
          <p className="hero-line">
            One place to collect, clean, and search openings from multiple sources.
          </p>
          <div className="hero-actions">
            <Link to="/jobs" className="btn btn-primary">
              Search jobs
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/recommendations" className="btn btn-ghost">
                  Get recommendations
                </Link>
                <Link to="/alerts" className="btn btn-ghost">
                  Job alerts
                </Link>
              </>
            ) : (
              <Link to="/register" className="btn btn-ghost">
                Create account
              </Link>
            )}
          </div>
          {health && (
            <p className="footer-note" style={{ color: "rgba(255,255,255,0.7)", marginTop: "1.5rem" }}>
              API {health.status === "ok" ? "online" : "offline"}
              {health.dbConnected ? " · database connected" : ""}
              {health.phase ? ` · phase ${health.phase}` : ""}
              {user ? ` · hi ${user.name?.split(" ")[0]}` : ""}
            </p>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner">
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={() => {
              const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
              navigate(`/jobs${params}`);
            }}
            placeholder="Try React, Bengaluru, internship..."
          />
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner">
          <h2 className="section-title">The problem</h2>
          <p className="home-lead">
            Job openings are scattered across portals and company career pages. Fields differ, duplicates
            appear, and checking every site by hand wastes time. This system aggregates listings, cleans
            them into one schema, and helps you filter and get matched.
          </p>
        </div>
      </section>

      <section className="home-section home-section-soft">
        <div className="home-section-inner">
          <h2 className="section-title">How it works</h2>
          <div className="home-steps">
            {STEPS.map((step, i) => (
              <article key={step.title} className="home-step" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="home-step-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p className="muted">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {stats && (
        <section className="home-section">
          <div className="home-section-inner">
            <h2 className="section-title">Live corpus</h2>
            <div className="home-stats">
              <div className="home-stat">
                <strong>{stats.active ?? 0}</strong>
                <span className="muted">Active jobs</span>
              </div>
              <div className="home-stat">
                <strong>{(stats.bySource || []).length}</strong>
                <span className="muted">Portals</span>
              </div>
              <div className="home-stat">
                <strong>
                  {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : "—"}
                </strong>
                <span className="muted">Last scrape</span>
              </div>
            </div>
            {(stats.bySource || []).length > 0 && (
              <p className="muted" style={{ marginTop: "1rem" }}>
                Sources:{" "}
                {(stats.bySource || [])
                  .map((s) => `${getSourceLabel(s._id)} (${s.count})`)
                  .join(" · ")}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="home-section home-section-soft">
        <div className="home-section-inner home-cta-band">
          <div>
            <h2 className="section-title" style={{ marginBottom: "0.35rem" }}>
              Ready to explore?
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Set your skills on your profile, then open recommendations or create an alert.
            </p>
          </div>
          <div className="filter-actions" style={{ marginTop: 0 }}>
            <Link to="/jobs" className="btn btn-accent">
              Browse jobs
            </Link>
            <Link to={isAuthenticated ? "/profile" : "/register"} className="btn btn-ghost">
              {isAuthenticated ? "Edit profile" : "Register"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
