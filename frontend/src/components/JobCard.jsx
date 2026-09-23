import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jobsApi } from "../api/client";
import { useState } from "react";
import { getSourceLabel, resolveApplyUrl } from "../utils/jobLinks";

function formatSalary(job) {
  if (job.salaryMin == null && job.salaryMax == null) return "Salary not listed";
  const cur = job.salaryCurrency || "INR";
  let min = job.salaryMin;
  let max = job.salaryMax;

  // Repair old bad parses like 8–15 meant as lakhs
  if (cur === "INR" && min != null && max != null && min < 1000 && max < 1000) {
    min *= 100000;
    max *= 100000;
  }

  if (min != null && max != null) {
    return `${cur} ${min.toLocaleString()} – ${max.toLocaleString()}`;
  }
  if (min != null) return `${cur} ${Number(min).toLocaleString()}+`;
  return `Up to ${cur} ${Number(max).toLocaleString()}`;
}

export default function JobCard({ job, index = 0, onSavedChange }) {
  const { isAuthenticated, refreshUser } = useAuth();
  const [saved, setSaved] = useState(!!job.isSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const outbound = resolveApplyUrl(job);
  const sourceLabel = getSourceLabel(job.source);

  const toggleSave = async () => {
    if (!isAuthenticated) {
      setError("Login to save jobs");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (saved) {
        await jobsApi.unsave(job._id);
        setSaved(false);
      } else {
        await jobsApi.save(job._id);
        setSaved(true);
      }
      await refreshUser();
      onSavedChange?.(job._id, !saved);
    } catch (err) {
      setError(err.message || "Could not update saved job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="job-item" style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}>
      <div className="job-item-top">
        <div>
          <div className="job-source-row">
            <span className="source-pill">{sourceLabel}</span>
          </div>
          <h2>{job.title}</h2>
          <p className="job-meta">
            {job.company} · {job.location} · {job.employmentType}
          </p>
        </div>
        <button
          type="button"
          className={`btn btn-sm ${saved ? "btn-accent" : "btn-ghost"}`}
          onClick={toggleSave}
          disabled={busy}
        >
          {busy ? "..." : saved ? "Saved" : "Save"}
        </button>
      </div>
      <p className="job-skills">{(job.skills || []).join(" · ")}</p>
      <p className="job-meta">
        {formatSalary(job)} · via <span className="source-inline">{sourceLabel}</span>
      </p>
      {error && (
        <p className="alert alert-error" style={{ marginTop: "0.6rem" }}>
          {error}
        </p>
      )}
      <div className="card-links">
        <Link className="job-link" to={`/jobs/${job._id}`}>
          View details →
        </Link>
        <a className="job-link" href={outbound.url} target="_blank" rel="noreferrer">
          {outbound.kind === "direct" ? `Open on ${sourceLabel}` : `Search on ${sourceLabel}`} →
        </a>
      </div>
    </article>
  );
}
