import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertsApi } from "../api/client";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [isAuthenticated]);

  const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="Intelligent Job Aggregation" className="brand-logo" />
          <span className="brand-text">
            Intelligent <span>Job Aggregation</span>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle btn btn-ghost btn-sm"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav className={`nav-links${menuOpen ? " open" : ""}`}>
          <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/jobs" className={linkClass} onClick={() => setMenuOpen(false)}>
            Jobs
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/recommendations" className={linkClass} onClick={() => setMenuOpen(false)}>
                For you
              </NavLink>
              <NavLink to="/alerts" className={linkClass} onClick={() => setMenuOpen(false)}>
                Alerts
                {unread > 0 && <span className="nav-badge">{unread > 9 ? "9+" : unread}</span>}
              </NavLink>
              <NavLink to="/saved" className={linkClass} onClick={() => setMenuOpen(false)}>
                Saved
              </NavLink>
              <NavLink to="/scrape" className={linkClass} onClick={() => setMenuOpen(false)}>
                Scrape
              </NavLink>
              <NavLink to="/profile" className={linkClass} onClick={() => setMenuOpen(false)}>
                Profile
              </NavLink>
              <span className="nav-user">{user?.name}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>
              <Link to="/register" className="btn btn-accent btn-sm" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
