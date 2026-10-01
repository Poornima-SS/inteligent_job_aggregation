import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    skills: "",
    experienceYears: 0,
    preferredLocations: "",
    preferredRoles: "",
    resumeText: "",
    resumeFileName: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await authApi.parseResume(file);
      setForm((current) => ({
        ...current,
        name: data.name || current.name,
        email: data.email || current.email,
        password: "",
        skills: data.skills?.length ? data.skills.join(", ") : current.skills,
        experienceYears:
          data.experienceYears == null ? current.experienceYears : data.experienceYears,
        preferredLocations: data.preferredLocations?.length
          ? data.preferredLocations.join(", ")
          : current.preferredLocations,
        preferredRoles: data.preferredRoles?.length
          ? data.preferredRoles.join(", ")
          : current.preferredRoles,
        resumeText: data.resumeText || current.resumeText,
        resumeFileName: data.resumeFileName || file.name,
      }));
      setMessage(data.message || "Resume fields filled");
    } catch (err) {
      setError(err.message || "Could not read that resume");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout wide">
      <h1 className="page-title">Create account</h1>
      <p className="page-sub">
        Upload your resume to fill name, skills, experience, locations, and roles. They are saved to
        MongoDB when you register.
      </p>
      <form className="panel form-grid" autoComplete="off" onSubmit={onSubmit}>
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
          {form.resumeFileName && (
            <p className="footer-note">
              Selected: <strong>{form.resumeFileName}</strong>
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={onChange} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password (min 6)</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
            readOnly
            required
            minLength={6}
            placeholder="Create a password"
          />
        </div>
        <div className="field">
          <label htmlFor="skills">Skills (comma separated)</label>
          <input id="skills" name="skills" value={form.skills} onChange={onChange} />
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
        <button className="btn btn-accent" type="submit" disabled={busy}>
          {busy ? "Creating..." : "Register"}
        </button>
        <p className="footer-note">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
