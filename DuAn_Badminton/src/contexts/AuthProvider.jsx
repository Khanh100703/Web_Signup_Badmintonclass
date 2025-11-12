import { useEffect, useState } from "react";
import { AuthCtx } from "./auth-context.js";
import { api } from "../services/api.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("access_token") || ""
  );

  async function login(email, password) {
    const res = await api.post("/api/users/login", { email, password });
    if (res.ok) {
      // backend trả { ok, token, refresh_token, user }
      const { user, token, refresh_token } = res;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("access_token", token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      setToken(token);
      return { ok: true };
    }
    return { ok: false, message: res.message || "Đăng nhập thất bại" };
  }

  function logout() {
    const refresh_token = localStorage.getItem("refresh_token");
    api.post("/api/auth/logout", { refresh_token }).catch(() => {});
    localStorage.clear();
    setUser(null);
    setToken("");
  }

  useEffect(() => {
    api.setToken(() => localStorage.getItem("access_token") || token);
  }, [token]);

  const value = { user, token, login, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
