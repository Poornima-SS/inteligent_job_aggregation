import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { jobsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import SkillTags from "../components/SkillTags";

export default function Recommendations() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        setData(await jobsApi.recommendations({ limit: 20, minScore: 25 }));
      } catch (err) {
        setError(err.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user?.skills?.join(","), user?.preferredLocations?.join(",")]);

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
          <h1 className="page-title">Recommendations</h1>
          <p className="page-sub">
            Ranked by your skills, preferred locations/roles, experience, and job freshness.
          </p>
        </div>
        <Link to="/profile" className="btn btn-ghost btn-sm">
          Edit profile
        </Link>
      </div>

      {data?.profile && (
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <p className="muted" style={{ margin: "0 0 0.65rem" }}>
            Matching with skills:{" "}
            <strong>{(data.profile.skills || []).join(", ") || "none"}</strong>
            {" · "}
            locations:{" "}
            <strong>{(data.profile.preferredLocations || []).join(", ") || "any"}</strong>
            {" · "}
            roles: <strong>{(data.profile.preferredRoles || []).join(", ") || "any"}</strong>
            {" · "}
            experience: <strong>{data.profile.experienceYears || 0} yrs</strong>
          </p>
          <SkillTags skills={data.profile.skills || []} />
        </div>
      )}

      {loading && <LoadingState label="Scoring jobs..." />}
      {error && <p className="alert alert-error">{error}</p>}
      {data?.message && !data.jobs?.length && !loading && (
        <EmptyState
          title="No strong matches yet"
          description={data.message}
          actionTo="/profile"
          actionLabel="Update profile"
        />
      )}

      {data?.jobs?.length > 0 && (
        <>
          <p className="muted">{data.total} matched jobs</p>
          <div className="job-list">
            {data.jobs.map((job, index) => (
              <div key={job._id} className="recommend-wrap">
                <div className="match-badge">Match {job.matchScore}%</div>
                <JobCard job={job} index={index} />
                {job.matchBreakdown && (
                  <p className="job-meta recommend-breakdown">
                    Skills {job.matchBreakdown.skills}% · Location {job.matchBreakdown.location}% ·
                    Role {job.matchBreakdown.role}% · Experience {job.matchBreakdown.experience}% ·
                    Recency {job.matchBreakdown.recency}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
