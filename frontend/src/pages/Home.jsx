import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1 className="hero-brand">Intelligent Job Aggregation</h1>
        <p className="hero-line">
          One place to collect, clean, and search openings from multiple sources.
        </p>
        <div className="hero-actions">
          <Link to="/jobs" className="btn btn-primary">
            Browse jobs
          </Link>
          {isAuthenticated ? (
            <Link to="/profile" className="btn btn-ghost">
              Hi {user?.name?.split(" ")[0] || "there"} — profile
            </Link>
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
          </p>
        )}
      </div>
    </section>
  );
}
