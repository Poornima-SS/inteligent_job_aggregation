import { Link } from "react-router-dom";

export default function EmptyState({
  title = "Nothing here yet",
  description = "",
  actionTo,
  actionLabel,
}) {
  return (
    <div className="panel empty-state">
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>{title}</h3>
      {description && (
        <p className="muted" style={{ margin: 0 }}>
          {description}
        </p>
      )}
      {actionTo && actionLabel && (
        <Link to={actionTo} className="btn btn-accent btn-sm" style={{ marginTop: "1rem" }}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
