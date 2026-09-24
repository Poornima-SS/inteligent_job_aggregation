import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <p className="muted" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
        404
      </p>
      <h1 className="page-title">Page not found</h1>
      <p className="page-sub" style={{ marginInline: "auto" }}>
        That route does not exist. Head back to jobs or the home page.
      </p>
      <div className="filter-actions" style={{ justifyContent: "center" }}>
        <Link to="/" className="btn btn-accent">
          Home
        </Link>
        <Link to="/jobs" className="btn btn-ghost">
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
