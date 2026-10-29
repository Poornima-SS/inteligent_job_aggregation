import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { alertsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getSourceLabel } from "../utils/jobLinks";
import MatchPopup from "../components/MatchPopup";

const emptyForm = {
  alertName: "My job alert",
  keywords: "",
  location: "",
  skills: "",
  employmentType: "",
  source: "",
  minMatchScore: 40,
  enabled: true,
  notifyEmail: true,
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
  const [matchPopup, setMatchPopup] = useState(null);
  const [mailInfo, setMailInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const refresh = useCallback(async () => {
    const [alertData, noteData, mail] = await Promise.all([
      alertsApi.list(),
      alertsApi.notifications({ limit: 40 }),
      alertsApi.mailStatus().catch(() => null),
    ]);
    setAlerts(alertData.alerts || []);
    setNotifications(noteData.notifications || []);
    setUnreadCount(noteData.unreadCount || 0);
    if (mail) setMailInfo(mail);
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
        const created = await alertsApi.create(payload);
        setMessage(created.message || "Alert created — matches email automatically when mail is configured");
        if (created.emailDelivery === "inbox" && (created.notify?.emailsSent || 0) > 0) {
          setMailInfo({
            configured: true,
            provider: created.emailProvider,
            delivery: "inbox",
            emailTo: user?.email,
          });
        }
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
      if (data.total > 0) {
        setMatchPopup({
          title: "Jobs matched your alert",
          message: `Found ${data.total} job${data.total === 1 ? "" : "s"} that match your skills, location, and score.`,
          primaryLabel: "See matches",
          onPrimary: () => {
            setMatchPopup(null);
            document.getElementById("alert-preview")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          },
        });
        setMessage(`Found ${data.total} matching job(s)`);
      } else {
        setMessage(
          "No jobs match these filters right now — try clearing location or lowering the match score"
        );
      }
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

  const describeMailResult = (outcome) => {
    const mailed = outcome.emailsSent || 0;
    if (outcome.emailPreviewUrl) setPreviewUrl(outcome.emailPreviewUrl);
    if (mailed > 0 && outcome.emailDelivery === "preview") {
      return `Email preview ready (Ethereal — not Gmail yet). Open the preview link below. Add RESEND_API_KEY in backend/.env for real inbox delivery to ${user?.email || "your email"}.`;
    }
    if (mailed > 0) {
      return `Email digest sent to ${user?.email || "your inbox"} via ${outcome.emailProvider || "mail"}.`;
    }
    if (outcome.emailError) {
      return `Email failed (${outcome.emailProvider || "mail"}): ${outcome.emailError}`;
    }
    return "No email sent.";
  };

  const checkNow = async () => {
    setBusy(true);
    setAction("check");
    setError("");
    setMessage("");
    setPreviewUrl("");
    try {
      const outcome = await alertsApi.runNow({ hours: 72 });
      const notes = outcome.yourNewNotifications || 0;
      let next = `Checked alerts — ${notes} new notification(s) for you. ${describeMailResult(outcome)}`;
      setMessage(next);
      if (outcome.emailProvider) {
        setMailInfo({
          configured: outcome.emailConfigured,
          provider: outcome.emailProvider,
          delivery: outcome.emailDelivery,
          emailTo: outcome.emailTo || user?.email,
        });
      }
      if (notes > 0) {
        setMatchPopup({
          title: "New recommendation matches",
          message: next,
          primaryLabel: "View notifications",
          onPrimary: () => {
            setMatchPopup(null);
            document.getElementById("alert-notifications")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          },
        });
      }
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

      {mailInfo?.delivery === "inbox" ? (
        <p className="muted" style={{ marginTop: "-0.35rem" }}>
          Automatic Gmail alerts on · check <strong>poornimass999@gmail.com</strong> on your phone
          (Resend free inbox) · via {mailInfo.provider}
        </p>
      ) : (
        <p className="alert alert-error" style={{ marginTop: "-0.15rem" }}>
          Paste a fresh Resend API key into <code>backend/.env</code> as{" "}
          <code>RESEND_API_KEY=re_...</code> (Create key at{" "}
          <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer">
            resend.com/api-keys
          </a>
          ), keep <code>RESEND_ACCOUNT_EMAIL=poornimass999@gmail.com</code>, restart backend. Free
          Resend delivers only to that Gmail.
        </p>
      )}

      {message && <p className="alert alert-ok">{message}</p>}
      {previewUrl && (
        <p className="alert alert-ok">
          Open email preview:{" "}
          <a href={previewUrl} target="_blank" rel="noreferrer">
            {previewUrl}
          </a>
        </p>
      )}
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
          Email me at {user?.email || "my account email"} when jobs match
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
                  <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                    {alert.notifyEmail
                      ? `Email alerts on · ${user?.email || "account email"}`
                      : "In-app only (email off)"}
                  </p>
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

      <MatchPopup
        open={!!matchPopup}
        title={matchPopup?.title}
        message={matchPopup?.message}
        primaryLabel={matchPopup?.primaryLabel}
        onPrimary={matchPopup?.onPrimary}
        onClose={() => setMatchPopup(null)}
      />

      <section id="alert-notifications">
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
