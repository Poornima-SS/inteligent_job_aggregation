import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { alertsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getSourceLabel } from "../utils/jobLinks";

const emptyForm = {
  alertName: "My job alert",
  keywords: "",
  location: "",
  skills: "",
  employmentType: "",
  source: "",
  minMatchScore: 40,
  enabled: true,
  notifyEmail: false,
};

function toPayload(form) {
  return {
    name: (form.alertName || "My job alert").trim() || "My job alert",
    keywords: form.keywords || "",
    location: form.location || "",
    skills: form.skills || "",
    employmentType: form.employmentType || "",
    source: form.source || "",
    minMatchScore: Number(form.minMatchScore) || 40,
    enabled: !!form.enabled,
    notifyEmail: !!form.notifyEmail,
  };
}

export default function Alerts() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState("");

  const refresh = useCallback(async () => {
    const [alertData, noteData] = await Promise.all([
      alertsApi.list(),
      alertsApi.notifications({ limit: 40 }),
    ]);
    setAlerts(alertData.alerts || []);
    setNotifications(noteData.notifications || []);
    setUnreadCount(noteData.unreadCount || 0);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh().catch((err) => setError(err.message || "Failed to load alerts"));
  }, [isAuthenticated, refresh]);

  if (authLoading) {
    return (
      <div className="page">
        <p className="muted">Checking account...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      keywords: (user?.preferredRoles || [])[0] || "",
      location: (user?.preferredLocations || [])[0] || "",
      skills: (user?.skills || []).slice(0, 4).join(", "),
    });
    setEditingId(null);
  };

  const saveAlert = async (e) => {
    if (e) e.preventDefault();
    setBusy(true);
    setAction("save");
    setError("");
    setMessage("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        await alertsApi.update(editingId, payload);
        setMessage("Alert updated successfully");
      } else {
        await alertsApi.create(payload);
        setMessage("Alert created successfully");
      }
      resetForm();
      setPreview(null);
      await refresh();
      requestAnimationFrame(() => {
        document.getElementById("your-alerts")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err.message || "Could not save alert. Is the backend running?");
    } finally {
      setBusy(false);
      setAction("");
    }
  };

  const runPreview = async (e) => {
    if (e) e.preventDefault();
    setBusy(true);
    setAction("preview");
    setError("");
    setMessage("");
    try {
      const data = await alertsApi.preview(toPayload(form));
      setPreview(data);
      setMessage(
        data.total
          ? `Found ${data.total} matching job(s)`
          : "No jobs match these filters right now — try clearing location or lowering the match score"
      );
      requestAnimationFrame(() => {
        document.getElementById("alert-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err.message || "Preview failed. Is the backend running on port 5000?");
      setPreview(null);
    } finally {
      setBusy(false);
      setAction("");
    }
  };

  const editAlert = (alert) => {
    setEditingId(alert._id);
    setForm({
      alertName: alert.name || "Job alert",
      keywords: alert.keywords || "",
      location: alert.location || "",
      skills: (alert.skills || []).join(", "),
      employmentType: alert.employmentType || "",
      source: alert.source || "",
      minMatchScore: alert.minMatchScore ?? 40,
      enabled: alert.enabled !== false,
      notifyEmail: !!alert.notifyEmail,
    });
    setPreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeAlert = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    setBusy(true);
    setError("");
    try {
      await alertsApi.remove(id);
      setMessage("Alert deleted");
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (alert) => {
    setBusy(true);
    try {
      await alertsApi.update(alert._id, {
        name: alert.name,
        keywords: alert.keywords,
        location: alert.location,
        skills: alert.skills,
        employmentType: alert.employmentType,
        source: alert.source,
        minMatchScore: alert.minMatchScore,
        notifyEmail: alert.notifyEmail,
        enabled: !alert.enabled,
      });
      await refresh();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const checkNow = async () => {
    setBusy(true);
    setAction("check");
    setError("");
    setMessage("");
    try {
      const outcome = await alertsApi.runNow({ hours: 72 });
      setMessage(
        `Checked alerts — ${outcome.yourNewNotifications || 0} new notification(s) for you`
      );
      await refresh();
    } catch (err) {
      setError(err.message || "Check failed");
    } finally {
      setBusy(false);
      setAction("");
    }
  };

  const markAll = async () => {
    await alertsApi.markAllRead();
    await refresh();
  };

  const markOne = async (id) => {
    await alertsApi.markRead(id);
    await refresh();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Job alerts</h1>
          <p className="page-sub">
            Get notified when scraped jobs match your keywords, location, and skills.
          </p>
        </div>
        <div className="filter-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-accent btn-sm" type="button" disabled={busy} onClick={checkNow}>
            {action === "check" ? "Checking..." : "Check matches now"}
          </button>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={markAll}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {message && <p className="alert alert-ok">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <div className="panel form-grid" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          {editingId ? "Edit alert" : "Create alert"}
        </h2>
        <div className="field">
          <label htmlFor="alertName">Alert name</label>
          <input
            id="alertName"
            name="alertName"
            value={form.alertName}
            onChange={onChange}
            placeholder="e.g. React jobs in Bengaluru"
          />
        </div>
        <div className="field">
          <label htmlFor="keywords">Keywords / role</label>
          <input
            id="keywords"
            name="keywords"
            value={form.keywords}
            onChange={onChange}
            placeholder="e.g. React Developer"
          />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="Bengaluru, Remote... (leave blank for any)"
          />
        </div>
        <div className="field">
          <label htmlFor="skills">Skills (comma separated)</label>
          <input
            id="skills"
            name="skills"
            value={form.skills}
            onChange={onChange}
            placeholder="React, Node.js"
          />
        </div>
        <div className="field">
          <label htmlFor="employmentType">Employment type</label>
          <select
            id="employmentType"
            name="employmentType"
            value={form.employmentType}
            onChange={onChange}
          >
            <option value="">Any</option>
            <option value="full-time">Full-time</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
            <option value="contract">Contract</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="source">Portal</label>
          <select id="source" name="source" value={form.source} onChange={onChange}>
            <option value="">Any portal</option>
            <option value="naukri">Naukri</option>
            <option value="indeed">Indeed</option>
            <option value="linkedin">LinkedIn</option>
            <option value="apna">Apna</option>
            <option value="remotive">Remotive</option>
            <option value="remoteok">RemoteOK</option>
            <option value="private-company">Company careers</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="minMatchScore">Minimum match score ({form.minMatchScore}%)</label>
          <input
            id="minMatchScore"
            name="minMatchScore"
            type="range"
            min="10"
            max="90"
            step="5"
            value={form.minMatchScore}
            onChange={onChange}
          />
        </div>
        <label className="check-row">
          <input type="checkbox" name="enabled" checked={form.enabled} onChange={onChange} />
          Alert enabled
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            name="notifyEmail"
            checked={form.notifyEmail}
            onChange={onChange}
          />
          Also email me (needs SMTP in backend .env)
        </label>

        <div className="filter-actions" style={{ marginTop: "0.25rem" }}>
          <button className="btn btn-accent" type="button" disabled={busy} onClick={saveAlert}>
            {action === "save" ? "Saving..." : editingId ? "Update alert" : "Create alert"}
          </button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={runPreview}>
            {action === "preview" ? "Previewing..." : "Preview matches"}
          </button>
          {editingId && (
            <button
              className="btn btn-ghost"
              type="button"
              disabled={busy}
              onClick={() => {
                resetForm();
                setMessage("");
                setError("");
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>

      {preview && (
        <div id="alert-preview" className="panel" style={{ marginBottom: "1.25rem" }}>
          <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>
            Preview: {preview.total} matching job(s)
          </p>
          {!preview.jobs?.length && (
            <p className="muted">No current jobs match these filters. Try clearing location or lowering the score.</p>
          )}
          <ul className="alert-preview-list">
            {(preview.jobs || []).map((job) => (
              <li key={job._id}>
                <Link to={`/jobs/${job._id}`}>
                  {job.title} · {job.company}
                </Link>
                <span className="muted">
                  {" "}
                  — {job.matchScore}% · {getSourceLabel(job.source)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section id="your-alerts" style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title">Your alerts ({alerts.length})</h2>
        {!alerts.length && (
          <p className="muted">
            No alerts yet. Fill the form above and click <strong>Create alert</strong>.
          </p>
        )}
        <div className="alert-cards">
          {alerts.map((alert) => (
            <article key={alert._id} className="panel alert-card">
              <div className="job-item-top">
                <div>
                  <span className={`source-pill${alert.enabled ? "" : " muted-pill"}`}>
                    {alert.enabled ? "On" : "Off"}
                  </span>
                  <h3 style={{ margin: "0.4rem 0 0.2rem" }}>{alert.name}</h3>
                  <p className="job-meta" style={{ margin: 0 }}>
                    {alert.keywords || "any role"} · {alert.location || "any location"} · min{" "}
                    {alert.minMatchScore}%
                    {alert.source ? ` · ${getSourceLabel(alert.source)}` : ""}
                  </p>
                  {!!alert.skills?.length && (
                    <p className="job-skills">{alert.skills.join(" · ")}</p>
                  )}
                </div>
              </div>
              <div className="card-links">
                <button className="job-link" type="button" onClick={() => editAlert(alert)}>
                  Edit
                </button>
                <button className="job-link" type="button" onClick={() => toggleEnabled(alert)}>
                  {alert.enabled ? "Disable" : "Enable"}
                </button>
                <button className="job-link" type="button" onClick={() => removeAlert(alert._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">
          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
        </h2>
        {!notifications.length && (
          <p className="muted">
            No notifications yet. After a scrape (or click Check matches now), matches appear here.
          </p>
        )}
        <div className="notify-list">
          {notifications.map((note) => {
            const job = note.jobId;
            return (
              <article
                key={note._id}
                className={`panel notify-item${note.read ? "" : " notify-unread"}`}
              >
                <div className="job-item-top">
                  <div>
                    {!note.read && <span className="match-badge">New</span>}
                    <h3 style={{ margin: "0.25rem 0" }}>{note.title}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {note.message}
                    </p>
                    {job?.source && (
                      <p className="job-meta">
                        via {getSourceLabel(job.source)} · Match {note.matchScore}%
                      </p>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="card-links">
                  {job?._id && (
                    <Link className="job-link" to={`/jobs/${job._id}`}>
                      View job →
                    </Link>
                  )}
                  {!note.read && (
                    <button className="job-link" type="button" onClick={() => markOne(note._id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
