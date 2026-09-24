import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/client";
import SkillTags from "../components/SkillTags";
import LoadingState from "../components/LoadingState";

export default function Profile() {
  const { user, loading, updateProfile, isAuthenticated } = useAuth();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setMessage("Profile saved — used for recommendations and alerts");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const extractSkills = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await usersApi.extractSkills({ resumeText: form.resumeText });
      if (data.skills?.length) {
        const existing = form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const merged = [...new Set([...existing, ...data.skills])];
        setForm((f) => ({ ...f, skills: merged.join(", ") }));
      }
      setMessage(data.message || "Skills extracted");
    } catch (err) {
      setError(err.message || "Extract failed");
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
      <h1 className="page-title">Your profile</h1>
      <p className="page-sub">
        Signed in as <strong>{user.email}</strong>. Skills and preferences power recommendations and
        alerts.
      </p>
      <form className="panel form-grid" onSubmit={onSubmit}>
        {message && <p className="alert alert-ok">{message}</p>}
        {error && <p className="alert alert-error">{error}</p>}
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
            placeholder="Paste resume text, then extract skills"
          />
        </div>
        <div className="filter-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-accent" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save profile"}
          </button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={extractSkills}>
            Extract skills from resume
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
