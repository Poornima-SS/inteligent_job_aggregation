export default function Pagination({ page, totalPages, onChange, disabled = false }) {
  if (!totalPages || totalPages <= 1) return null;

  const current = Math.max(1, Math.min(Number(page) || 1, totalPages));

  const go = (next) => {
    const safe = Math.max(1, Math.min(next, totalPages));
    if (safe === current || disabled) return;
    onChange(safe);
  };

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled || current <= 1}
        onClick={() => go(current - 1)}
      >
        Previous
      </button>
      <span className="muted">
        Page {current} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled || current >= totalPages}
        onClick={() => go(current + 1)}
      >
        Next
      </button>
    </div>
  );
}
