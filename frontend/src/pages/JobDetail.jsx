import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { jobsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getSourceLabel, resolveApplyUrl } from "../utils/jobLinks";

export default function JobDetail() {
  const { id } = useParams();
  const { isAuthenticated, refreshUser } = useAuth();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setJob(await jobsApi.get(id));
      } catch (err) {
        setError(err.message || "Job not found");
      }
    };
    load();
  }, [id]);

  const toggleSave = async () => {
    if (!isAuthenticated) {
      setMessage("Login to save this job");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (job.isSaved) {
        await jobsApi.unsave(job._id);
        setJob((j) => ({ ...j, isSaved: false }));
        setMessage("Removed from saved jobs");
      } else {
        await jobsApi.save(job._id);
        setJob((j) => ({ ...j, isSaved: true }));
        setMessage("Saved to your list");
      }
      await refreshUser();
    } catch (err) {
      setMessage(err.message || "Could not update saved job");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="page">
        <p className="alert alert-error">{error}</p>
        <Link className="detail-back" to="/jobs">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page">
        <p className="muted">Loading job...</p>
      </div>
    );
  }

  const sourceLabel = getSourceLabel(job.source);
  const outbound = resolveApplyUrl(job);

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Link className="detail-back" to="/jobs">
        ← Back to jobs
      </Link>
      <h1 className="page-title" style={{ marginTop: "0.85rem" }}>
        {job.title}
      </h1>
      <p className="job-meta">
        {job.company} · {job.location} · {job.employmentType}
      </p>

      <div className="source-banner">
        <span className="source-pill">{sourceLabel}</span>
        <span className="muted">Source platform / channel for this listing</span>
      </div>

      <div className="panel section-block">
        <p className="job-skills" style={{ marginBottom: "1rem" }}>
          <strong>Skills:</strong> {(job.skills || []).join(", ") || "Not listed"}
        </p>
        <p className="job-meta" style={{ marginBottom: "1rem" }}>
          Experience: {job.experienceMin ?? 0}
          {job.experienceMax != null ? `–${job.experienceMax}` : "+"} years
          {job.salaryMin != null || job.salaryMax != null
            ? ` · Salary: ${job.salaryCurrency || "INR"} ${
                job.salaryMin?.toLocaleString?.() || "—"
              } – ${job.salaryMax?.toLocaleString?.() || "—"}`
            : ""}
        </p>
        <p style={{ margin: "0 0 1.25rem", lineHeight: 1.65, color: "var(--ink-soft)" }}>
          {job.description || "No description provided."}
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className={`btn ${job.isSaved ? "btn-ghost" : "btn-accent"}`}
            onClick={toggleSave}
            disabled={busy}
          >
            {busy ? "Please wait..." : job.isSaved ? "Unsave job" : "Save job"}
          </button>
          <a
            className="btn btn-primary"
            href={outbound.url}
            target="_blank"
            rel="noreferrer"
          >
            {outbound.label}
          </a>
        </div>

        <p className="muted" style={{ marginTop: "0.85rem", wordBreak: "break-all" }}>
          Opens: {outbound.url}
        </p>
        {outbound.note && <p className="alert alert-ok" style={{ marginTop: "0.75rem" }}>{outbound.note}</p>}

        {message && (
          <p
            className={`alert ${
              message.includes("Login") || message.includes("Could") ? "alert-error" : "alert-ok"
            }`}
            style={{ marginTop: "1rem" }}
          >
            {message}
            {message.includes("Login") && (
              <>
                {" "}
                <Link to="/login">Go to login</Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
