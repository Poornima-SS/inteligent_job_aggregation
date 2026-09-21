import { createContext, useContext, useEffect, useState } from "react";
import { authApi, usersApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      return null;
    }
    const data = await authApi.me();
    setUser(data.user);
    return data.user;
  };

  useEffect(() => {
    const boot = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [token]);

  const persistAuth = (nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    persistAuth(data.token, data.user);
    return data;
  };

  const login = async (payload) => {
    const data = await authApi.login(payload);
    persistAuth(data.token, data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const data = await usersApi.updateMe(payload);
    setUser(data.user);
    return data;
  };

  const isJobSaved = (jobId) =>
    !!(user?.savedJobs || []).some((id) => String(id) === String(jobId));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        refreshUser,
        isJobSaved,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
