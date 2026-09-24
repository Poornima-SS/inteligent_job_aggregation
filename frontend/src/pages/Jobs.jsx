import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { jobsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/FilterBar";
import JobCard from "../components/JobCard";
import Pagination from "../components/Pagination";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

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
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    q: searchParams.get("q") || "",
  }));
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextFilters = filters, nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const [result, statsData] = await Promise.all([
        jobsApi.list({
          ...nextFilters,
          page: nextPage,
          limit: 8,
        }),
        jobsApi.stats().catch(() => null),
      ]);
      setData(result);
      if (statsData) setStats(statsData);
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

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q && q !== filters.q) {
      const next = { ...filters, q };
      setFilters(next);
      setPage(1);
      load(next, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
            {stats?.lastUpdated && (
              <>
                {" "}
                Last scrape update: <strong>{new Date(stats.lastUpdated).toLocaleString()}</strong>.
              </>
            )}
            {!isAuthenticated && (
              <>
                {" "}
                <Link to="/login">Login</Link> to save jobs.
              </>
            )}
          </p>
        </div>
        {isAuthenticated && (
          <div className="filter-actions" style={{ marginTop: 0 }}>
            <Link to="/recommendations" className="btn btn-accent btn-sm">
              Recommendations
            </Link>
            <Link to="/saved" className="btn btn-ghost btn-sm">
              Saved jobs
            </Link>
          </div>
        )}
      </div>

      <FilterBar value={filters} onChange={setFilters} onSubmit={onSubmit} onReset={onReset} />

      {loading && <LoadingState label="Loading openings..." />}
      {error && <p className="alert alert-error">{error}</p>}

      {!loading && data && data.jobs.length === 0 && (
        <EmptyState
          title="No jobs matched"
          description="Try resetting filters or broadening your search keywords."
          actionTo={isAuthenticated ? "/scrape" : "/login"}
          actionLabel={isAuthenticated ? "Run a scrape" : "Login"}
        />
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
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
}
