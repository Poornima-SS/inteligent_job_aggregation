import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertsApi } from "../api/client";
import { getSourceLabel } from "../utils/jobLinks";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const panelRef = useRef(null);

  const refreshUnread = async () => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }
    try {
      const data = await alertsApi.unreadCount();
      setUnread(data.unreadCount || 0);
    } catch {
      setUnread(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      setNotes([]);
      setPanelOpen(false);
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
    setPanelOpen(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onDocClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [panelOpen]);

  const openNotifications = async () => {
    const next = !panelOpen;
    setPanelOpen(next);
    if (!next || !isAuthenticated) return;
    setLoadingNotes(true);
    try {
      const data = await alertsApi.notifications({ limit: 12 });
      setNotes(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const markOne = async (id) => {
    await alertsApi.markRead(id);
    setNotes((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    await refreshUnread();
  };

  const markAll = async () => {
    await alertsApi.markAllRead();
    setNotes((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

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

              <div className="nav-notify" ref={panelRef}>
                <button
                  type="button"
                  className="nav-notify-btn"
                  aria-label="Notifications"
                  aria-expanded={panelOpen}
                  onClick={openNotifications}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2V11a7 7 0 1 0-14 0v4.8L3.4 17.4v1.1h17.2v-1.1L19 15.8Z"
                      fill="currentColor"
                    />
                  </svg>
                  {unread > 0 && (
                    <span className="nav-badge nav-badge-float">{unread > 9 ? "9+" : unread}</span>
                  )}
                </button>

                {panelOpen && (
                  <div className="nav-notify-panel">
                    <div className="nav-notify-head">
                      <strong>Notifications</strong>
                      {unread > 0 && (
                        <button type="button" className="job-link" onClick={markAll}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {loadingNotes && <p className="muted nav-notify-empty">Loading...</p>}

                    {!loadingNotes && notes.length === 0 && (
                      <p className="muted nav-notify-empty">No notifications yet.</p>
                    )}

                    {!loadingNotes && notes.length > 0 && (
                      <ul className="nav-notify-list">
                        {notes.map((note) => {
                          const job = note.jobId;
                          return (
                            <li
                              key={note._id}
                              className={`nav-notify-item${note.read ? "" : " is-unread"}`}
                            >
                              <button
                                type="button"
                                className="nav-notify-item-btn"
                                onClick={async () => {
                                  if (!note.read) await markOne(note._id);
                                  setPanelOpen(false);
                                  setMenuOpen(false);
                                  if (job?._id) navigate(`/jobs/${job._id}`);
                                  else navigate("/alerts");
                                }}
                              >
                                <span className="nav-notify-title">{note.title}</span>
                                <span className="nav-notify-msg">{note.message}</span>
                                <span className="nav-notify-meta">
                                  {job?.source ? `${getSourceLabel(job.source)} · ` : ""}
                                  {note.matchScore != null ? `${note.matchScore}% · ` : ""}
                                  {new Date(note.createdAt).toLocaleString()}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <Link
                      to="/alerts"
                      className="nav-notify-footer"
                      onClick={() => {
                        setPanelOpen(false);
                        setMenuOpen(false);
                      }}
                    >
                      Open all alerts →
                    </Link>
                  </div>
                )}
              </div>

              <span className="nav-user">{user?.name}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMenuOpen(false);
                  setPanelOpen(false);
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
