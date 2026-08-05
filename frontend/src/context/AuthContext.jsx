import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bm_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("bm_token");
    if (!t) { setLoading(false); return; }
    api.get("/auth/me").then(r => {
      setUser(r.data);
      localStorage.setItem("bm_user", JSON.stringify(r.data));
    }).catch(() => {
      localStorage.removeItem("bm_token");
      localStorage.removeItem("bm_user");
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("bm_token", data.token);
    localStorage.setItem("bm_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("bm_token");
    localStorage.removeItem("bm_user");
    setUser(null);
    window.location.href = "/login";
  };

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
