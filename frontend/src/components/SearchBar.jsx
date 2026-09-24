export default function SearchBar({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Search role, skill, or company...",
}) {
  return (
    <form
      className="search-bar panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label="Search jobs"
      />
      <button className="btn btn-accent" type="submit">
        Search
      </button>
    </form>
  );
}
