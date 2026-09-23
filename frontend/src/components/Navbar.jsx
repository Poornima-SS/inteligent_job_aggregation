import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertsApi } from "../api/client";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const data = await alertsApi.unreadCount();
        if (!cancelled) setUnread(data.unreadCount || 0);
      } catch {
        if (!cancelled) setUnread(0);
      }
    };
    load();
    const timer = setInterval(load, 45000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isAuthenticated, user?._id]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          Intelligent <span>Job Aggregation</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end>
            Home
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Jobs
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/recommendations"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                For you
              </NavLink>
              <NavLink
                to="/alerts"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                Alerts
                {unread > 0 && <span className="nav-badge">{unread > 9 ? "9+" : unread}</span>}
              </NavLink>
              <NavLink
                to="/saved"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                Saved
              </NavLink>
              <NavLink
                to="/scrape"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                Scrape
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                Profile
              </NavLink>
              <span className="nav-user">{user?.name}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                Login
              </NavLink>
              <Link to="/register" className="btn btn-accent btn-sm">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
