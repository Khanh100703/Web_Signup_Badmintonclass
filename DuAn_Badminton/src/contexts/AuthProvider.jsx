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
  const [bootstrapped, setBootstrapped] = useState(false);

  const persistUser = (value) => {
    if (value) localStorage.setItem("user", JSON.stringify(value));
    else localStorage.removeItem("user");
    setUser(value);
  };

  async function login(email, password) {
    const res = await api.post("/api/users/login", { email, password });
    if (res.ok) {
      // backend trả { ok, token, refresh_token, user }
      const { user, token, refresh_token } = res;
      persistUser(user);
      localStorage.setItem("access_token", token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
      setToken(token);
      return { ok: true };
    }
    return { ok: false, message: res.message || "Đăng nhập thất bại" };
  }

  function logout() {
    const refresh_token = localStorage.getItem("refresh_token");
    api.post("/api/auth/logout", { refresh_token }).catch(() => {});
    localStorage.clear();
    persistUser(null);
    setToken("");
    setBootstrapped(true);
  }

  async function refreshUser() {
    if (!localStorage.getItem("access_token")) {
      persistUser(null);
      return null;
    }
    try {
      const res = await api.get("/api/users/me");
      if (res?.ok && res.data) {
        persistUser(res.data);
        return res.data;
      }
      if (res?.status === 401) logout();
    } catch (error) {
      console.error("refreshUser", error);
    }
    return null;
  }

  const updateUserLocal = (partial) => {
    persistUser({ ...(user || {}), ...partial });
  };

  useEffect(() => {
    api.setToken(() => localStorage.getItem("access_token") || token);
  }, [token]);

  useEffect(() => {
    let ignore = false;
    const bootstrap = async () => {
      if (!token) {
        if (!ignore) {
          persistUser(null);
          setBootstrapped(true);
        }
        return;
      }
      const me = await refreshUser();
      if (!ignore) setBootstrapped(true);
      if (me) return;
    };
    bootstrap();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = {
    user,
    token,
    login,
    logout,
    refreshUser,
    updateUserLocal,
    bootstrapped,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
