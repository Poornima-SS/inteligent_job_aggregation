export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
      <p className="muted" style={{ margin: "0.75rem 0 0" }}>
        {label}
      </p>
    </div>
  );
}
