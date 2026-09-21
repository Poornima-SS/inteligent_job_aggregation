import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jobsApi } from "../api/client";
import { useState } from "react";

function formatSalary(job) {
  if (job.salaryMin == null && job.salaryMax == null) return "Salary not listed";
  const cur = job.salaryCurrency || "INR";
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${cur} ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`;
  }
  if (job.salaryMin != null) return `${cur} ${job.salaryMin.toLocaleString()}+`;
  return `Up to ${cur} ${job.salaryMax.toLocaleString()}`;
}

export default function JobCard({ job, index = 0, onSavedChange }) {
  const { isAuthenticated, refreshUser } = useAuth();
  const [saved, setSaved] = useState(!!job.isSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      <p className="job-meta">{formatSalary(job)} · source: {job.source}</p>
      {error && <p className="alert alert-error" style={{ marginTop: "0.6rem" }}>{error}</p>}
      <Link className="job-link" to={`/jobs/${job._id}`}>
        View details →
      </Link>
    </article>
  );
}
