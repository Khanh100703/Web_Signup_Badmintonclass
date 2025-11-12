import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const AuthCtx = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("access_token") || ""
  );

  async function login(email, password) {
    const res = await api.post("/api/users/login", { email, password });
    if (res?.ok) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("access_token", res.token);
      if (res.refresh_token)
        localStorage.setItem("refresh_token", res.refresh_token);
      return true;
    }
    return false;
  }

  function logout() {
    const refresh_token = localStorage.getItem("refresh_token");
    api.post("/api/auth/logout", { refresh_token }).catch(() => {});
    setUser(null);
    setToken("");
    localStorage.clear();
  }

  useEffect(() => {
    api.setToken(() => localStorage.getItem("access_token") || token);
  }, [token]);

  const value = { user, token, login, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
