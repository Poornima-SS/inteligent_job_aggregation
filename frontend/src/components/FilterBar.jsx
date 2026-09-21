const empty = {
  q: "",
  location: "",
  skills: "",
  employmentType: "",
  source: "",
  experienceMax: "",
  salaryMin: "",
  sort: "newest",
};

export default function FilterBar({ value, onChange, onSubmit, onReset }) {
  const filters = { ...empty, ...value };

  const set = (key, next) => onChange({ ...filters, [key]: next });

  return (
    <form className="filter-bar panel" onSubmit={onSubmit}>
      <div className="filter-grid">
        <div className="field">
          <label htmlFor="q">Keyword</label>
          <input
            id="q"
            value={filters.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Role, skill, company..."
          />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            value={filters.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Bengaluru, Remote..."
          />
        </div>
        <div className="field">
          <label htmlFor="skills">Skills</label>
          <input
            id="skills"
            value={filters.skills}
            onChange={(e) => set("skills", e.target.value)}
            placeholder="React, Node.js"
          />
        </div>
        <div className="field">
          <label htmlFor="employmentType">Employment type</label>
          <select
            id="employmentType"
            value={filters.employmentType}
            onChange={(e) => set("employmentType", e.target.value)}
          >
            <option value="">Any</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="experienceMax">Max experience needed (years)</label>
          <input
            id="experienceMax"
            type="number"
            min="0"
            value={filters.experienceMax}
            onChange={(e) => set("experienceMax", e.target.value)}
            placeholder="e.g. 2"
          />
        </div>
        <div className="field">
          <label htmlFor="salaryMin">Min salary (INR)</label>
          <input
            id="salaryMin"
            type="number"
            min="0"
            value={filters.salaryMin}
            onChange={(e) => set("salaryMin", e.target.value)}
            placeholder="e.g. 400000"
          />
        </div>
        <div className="field">
          <label htmlFor="source">Source</label>
          <select
            id="source"
            value={filters.source}
            onChange={(e) => set("source", e.target.value)}
          >
            <option value="">Any</option>
            <option value="seed">seed</option>
            <option value="seed-alt">seed-alt</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={filters.sort} onChange={(e) => set("sort", e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="salary_high">Salary high → low</option>
            <option value="salary_low">Salary low → high</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>
      <div className="filter-actions">
        <button className="btn btn-accent" type="submit">
          Apply filters
        </button>
        <button className="btn btn-ghost" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </form>
  );
}
