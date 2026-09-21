import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

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
                to="/saved"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                Saved
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
