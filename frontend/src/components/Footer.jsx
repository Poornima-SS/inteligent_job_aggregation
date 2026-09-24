import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link to="/" className="footer-logo-link">
            <img src="/logo.png" alt="Intelligent Job Aggregation" className="footer-logo" />
          </Link>
          <p className="muted" style={{ margin: "0.65rem 0 0", maxWidth: "36ch" }}>
            Scrape, clean, dedupe, and match openings from Naukri, Indeed, LinkedIn, Apna, and public
            APIs.
          </p>
        </div>
        <div className="footer-links">
          <Link to="/jobs">Jobs</Link>
          <Link to="/recommendations">For you</Link>
          <Link to="/alerts">Alerts</Link>
          <Link to="/scrape">Scrape</Link>
        </div>
      </div>
      <p className="footer-copy muted">Phases 0–10 complete · React + Node.js + MongoDB</p>
    </footer>
  );
}
