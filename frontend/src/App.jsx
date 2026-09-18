import { useState, useEffect } from "react";

const API = "/api";

export default function App() {
  const [message, setMessage] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgRes, usersRes, healthRes] = await Promise.all([
          fetch(`${API}/message`),
          fetch(`${API}/users`),
          fetch(`${API}/health`),
        ]);
        if (!msgRes.ok || !usersRes.ok || !healthRes.ok) {
          throw new Error("Backend returned an error");
        }
        setMessage(await msgRes.json());
        setUsers(await usersRes.json());
        setHealth(await healthRes.json());
      } catch (err) {
        setError("Failed to connect to backend. Is the server running on port 5000?");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={styles.container}>
      <p style={styles.eyebrow}>Phase 0 — Environment</p>
      <h1 style={styles.title}>Intelligent Job Aggregation</h1>
      <p style={styles.subtitle}>
        React + Node.js scaffold is live. Next phases add auth, scraping, and job search.
      </p>

      <div
        style={{
          ...styles.card,
          borderLeft: `4px solid ${error ? "#ef4444" : "#22c55e"}`,
        }}
      >
        <p style={styles.label}>Backend Status</p>
        {loading ? (
          <p style={styles.muted}>Connecting...</p>
        ) : error ? (
          <p style={{ color: "#ef4444" }}>{error}</p>
        ) : (
          <>
            <p style={{ color: "#22c55e", fontWeight: 600 }}>✓ {message.status}</p>
            <p style={styles.muted}>{message.message}</p>
            {health && (
              <p style={styles.muted}>
                DB: {health.dbConnected ? "connected" : "not connected (optional for Phase 0)"}
              </p>
            )}
          </>
        )}
      </div>

      {!loading && !error && (
        <div style={styles.card}>
          <p style={styles.label}>Sample users from API</p>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.id}</td>
                  <td style={styles.td}>{u.name}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 640,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  },
  title: { fontSize: 28, margin: "0 0 8px", color: "#1e293b" },
  subtitle: { color: "#64748b", marginBottom: 24, lineHeight: 1.5 },
  card: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
    marginBottom: 8,
  },
  muted: { color: "#64748b", margin: "4px 0" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    background: "#e2e8f0",
    fontSize: 13,
    color: "#475569",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#334155",
  },
  badge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
  },
};
