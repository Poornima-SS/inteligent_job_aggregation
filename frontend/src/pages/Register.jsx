import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    skills: "React, Node.js, MongoDB",
    experienceYears: 0,
    preferredLocations: "Bengaluru, Remote",
    preferredRoles: "Developer",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
        Tell us your skills once — later phases will rank jobs against this profile.
      </p>
      <form className="panel form-grid" onSubmit={onSubmit}>
        {error && <p className="alert alert-error">{error}</p>}
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
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
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
