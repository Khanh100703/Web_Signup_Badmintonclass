import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api";

const AuthContext = createContext(null);

function saveToken(token) {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const response = await authApi.getProfile();
        setUser(response.data);
      } catch (err) {
        console.error("Failed to load profile", err);
        saveToken(null);
        setToken(null);
      } finally {
        setInitializing(false);
      }
    }
    bootstrap();
  }, [token]);

  const handleAuthSuccess = (payload) => {
    const { token: newToken, user: profile } = payload;
    saveToken(newToken);
    setToken(newToken);
    setUser(profile ?? null);
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      handleAuthSuccess(response);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const response = await authApi.register(payload);
      handleAuthSuccess(response);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    saveToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const response = await authApi.getProfile();
    setUser(response.data);
    return response.data;
  };

  const updateProfile = async (payload) => {
    const response = await authApi.updateProfile(payload);
    setUser(response.data);
    return response.data;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      setUser,
    }),
    [user, token, loading, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
