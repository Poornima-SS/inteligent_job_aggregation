import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { jobsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import Pagination from "../components/Pagination";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

export default function SavedJobs() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const result = await jobsApi.saved({ page: nextPage, limit: 8 });
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page]);

  if (authLoading) {
    return (
      <div className="page">
        <LoadingState label="Checking account..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Saved jobs</h1>
          <p className="page-sub">Jobs you bookmarked for later review.</p>
        </div>
        <Link to="/jobs" className="btn btn-ghost btn-sm">
          Browse all
        </Link>
      </div>

      {loading && <LoadingState label="Loading saved jobs..." />}
      {error && <p className="alert alert-error">{error}</p>}

      {!loading && data && data.jobs.length === 0 && (
        <EmptyState
          title="No saved jobs yet"
          description="Open a listing and click Save to bookmark it here."
          actionTo="/jobs"
          actionLabel="Browse jobs"
        />
      )}

      {data && data.jobs.length > 0 && (
        <>
          <p className="muted">{data.total} saved</p>
          <div className="job-list">
            {data.jobs.map((job, index) => (
              <JobCard
                key={job._id}
                job={job}
                index={index}
                onSavedChange={(id, saved) => {
                  if (!saved) {
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            jobs: prev.jobs.filter((j) => j._id !== id),
                            total: Math.max(0, prev.total - 1),
                          }
                        : prev
                    );
                  }
                }}
              />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
