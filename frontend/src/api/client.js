const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const authApi = {
  register: (body) => api("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => api("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => api("/auth/me"),
};

export const usersApi = {
  updateMe: (body) => api("/users/me", { method: "PUT", body: JSON.stringify(body) }),
};

export const jobsApi = {
  list: (params = {}) => api(`/jobs${typeof params === "string" ? params : toQuery(params)}`),
  stats: () => api("/jobs/stats"),
  get: (id) => api(`/jobs/${id}`),
  saved: (params = {}) => api(`/jobs/saved${toQuery(params)}`),
  save: (id) => api(`/jobs/${id}/save`, { method: "POST" }),
  unsave: (id) => api(`/jobs/${id}/save`, { method: "DELETE" }),
};

export const scrapeApi = {
  sources: () => api("/scrape/sources"),
  logs: (params = {}) => api(`/scrape/logs${toQuery(params)}`),
  run: (body) => api("/scrape/run", { method: "POST", body: JSON.stringify(body) }),
};
