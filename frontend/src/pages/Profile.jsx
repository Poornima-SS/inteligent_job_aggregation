import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/client";
import SkillTags from "../components/SkillTags";
import LoadingState from "../components/LoadingState";

export default function Profile() {
  const { user, loading, updateProfile, refreshUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const redirectTimer = useRef(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedPopup, setSavedPopup] = useState(false);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const goToJobs = () => {
    clearTimeout(redirectTimer.current);
    navigate("/jobs");
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        skills: (user.skills || []).join(", "),
        experienceYears: user.experienceYears || 0,
        preferredLocations: (user.preferredLocations || []).join(", "),
        preferredRoles: (user.preferredRoles || []).join(", "),
        resumeText: user.resumeText || "",
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="page">
        <LoadingState label="Loading profile..." />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!form) return null;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
      });
      setSavedPopup(true);
      redirectTimer.current = setTimeout(() => navigate("/jobs"), 1600);
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const applyResume = async (data) => {
    const saved = data.user;
    setForm((current) => ({
      ...current,
      name: saved?.name || data.name || current.name,
      skills: (saved?.skills || data.skills || []).length
        ? (saved?.skills || data.skills).join(", ")
        : current.skills,
      experienceYears:
        saved?.experienceYears ?? data.experienceYears ?? current.experienceYears,
      preferredLocations: (saved?.preferredLocations || data.preferredLocations || []).length
        ? (saved?.preferredLocations || data.preferredLocations).join(", ")
        : current.preferredLocations,
      preferredRoles: (saved?.preferredRoles || data.preferredRoles || []).length
        ? (saved?.preferredRoles || data.preferredRoles).join(", ")
        : current.preferredRoles,
      resumeText: saved?.resumeText || data.resumeText || current.resumeText,
    }));
    if (saved) await refreshUser();
    setMessage(data.message || "Resume saved to MongoDB");
  };

  const extractSkills = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await applyResume(await usersApi.extractSkills({ resumeText: form.resumeText }));
    } catch (err) {
      setError(err.message || "Extract failed");
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await applyResume(await usersApi.uploadResume(file));
    } catch (err) {
      setError(err.message || "Could not read that resume");
    } finally {
      setBusy(false);
    }
  };

  const skillList = form.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      {savedPopup && (
        <div className="save-popup" role="dialog" aria-modal="true" aria-labelledby="save-popup-title">
          <div className="save-popup-card">
            <h2 id="save-popup-title">Profile saved</h2>
            <p>Your profile is saved. Opening the job search page.</p>
            <button className="btn btn-accent" type="button" onClick={goToJobs}>
              Go to job search
            </button>
          </div>
        </div>
      )}
      <h1 className="page-title">Your profile</h1>
      <p className="page-sub">
        Signed in as <strong>{user.email}</strong>. Skills and preferences power recommendations and
        alerts.
      </p>
      <form className="panel form-grid" onSubmit={onSubmit}>
        {message && <p className="alert alert-ok">{message}</p>}
        {error && <p className="alert alert-error">{error}</p>}
        <div className="field">
          <label htmlFor="resumeFile">Upload resume (PDF, DOCX, or TXT)</label>
          <input
            id="resumeFile"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain"
            onChange={onUpload}
            disabled={busy}
          />
          <p className="footer-note">
            Uploading saves name, skills, experience, locations, roles, and resume text to MongoDB.
          </p>
          {user.resumeFileName && (
            <p className="footer-note">
              Last file: <strong>{user.resumeFileName}</strong>
              {user.resumeUploadedAt
                ? ` · ${new Date(user.resumeUploadedAt).toLocaleString()}`
                : ""}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={onChange} required />
        </div>
        <div className="field">
          <label htmlFor="skills">Skills (comma separated)</label>
          <input id="skills" name="skills" value={form.skills} onChange={onChange} />
          <SkillTags skills={skillList} />
        </div>
        <div className="field">
          <label htmlFor="experienceYears">Experience (years)</label>
          <input
            id="experienceYears"
            type="number"
            min="0"
            name="experienceYears"
            value={form.experienceYears}
            onChange={onChange}
          />
        </div>
        <div className="field">
          <label htmlFor="preferredLocations">Preferred locations</label>
          <input
            id="preferredLocations"
            name="preferredLocations"
            value={form.preferredLocations}
            onChange={onChange}
          />
        </div>
        <div className="field">
          <label htmlFor="preferredRoles">Preferred roles</label>
          <input
            id="preferredRoles"
            name="preferredRoles"
            value={form.preferredRoles}
            onChange={onChange}
          />
        </div>
        <div className="field">
          <label htmlFor="resumeText">Resume text (optional)</label>
          <textarea
            id="resumeText"
            name="resumeText"
            value={form.resumeText}
            onChange={onChange}
            rows={6}
            placeholder="Or paste resume text, then fill fields"
          />
        </div>
        <div className="filter-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-accent" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save profile"}
          </button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={extractSkills}>
            Fill from pasted text
          </button>
        </div>
        <p className="footer-note">
          Ready to explore? <Link to="/jobs">Browse jobs</Link> ·{" "}
          <Link to="/recommendations">Recommendations</Link>
        </p>
      </form>
    </div>
  );
}
