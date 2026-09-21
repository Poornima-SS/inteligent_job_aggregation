import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/FilterBar";
import JobCard from "../components/JobCard";
import Pagination from "../components/Pagination";

const defaultFilters = {
  q: "",
  location: "",
  skills: "",
  employmentType: "",
  source: "",
  experienceMax: "",
  salaryMin: "",
  sort: "newest",
};

export default function Jobs() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextFilters = filters, nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const result = await jobsApi.list({
        ...nextFilters,
        page: nextPage,
        limit: 8,
      });
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load(filters, 1);
  };

  const onReset = () => {
    setFilters(defaultFilters);
    setPage(1);
    load(defaultFilters, 1);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-sub">
            Filter by skills, location, experience, salary, and type.
            {!isAuthenticated && (
              <>
                {" "}
                <Link to="/login">Login</Link> to save jobs.
              </>
            )}
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/saved" className="btn btn-ghost btn-sm">
            Saved jobs
          </Link>
        )}
      </div>

      <FilterBar
        value={filters}
        onChange={setFilters}
        onSubmit={onSubmit}
        onReset={onReset}
      />

      {loading && <p className="muted">Loading openings...</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {!loading && data && data.jobs.length === 0 && (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            No jobs matched these filters. Try resetting or broadening your search.
          </p>
        </div>
      )}

      {data && data.jobs.length > 0 && (
        <>
          <p className="muted">
            {data.total} result{data.total === 1 ? "" : "s"}
          </p>
          <div className="job-list">
            {data.jobs.map((job, index) => (
              <JobCard key={job._id} job={job} index={index} />
            ))}
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
