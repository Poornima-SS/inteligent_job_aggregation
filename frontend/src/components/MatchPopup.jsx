export default function MatchPopup({ open, title, message, primaryLabel, onPrimary, onClose }) {
  if (!open) return null;

  return (
    <div className="save-popup" role="dialog" aria-modal="true" aria-labelledby="match-popup-title">
      <div className="save-popup-card">
        <h2 id="match-popup-title">{title}</h2>
        <p>{message}</p>
        <div className="filter-actions" style={{ marginTop: 0 }}>
          {primaryLabel && onPrimary && (
            <button className="btn btn-accent" type="button" onClick={onPrimary}>
              {primaryLabel}
            </button>
          )}
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
