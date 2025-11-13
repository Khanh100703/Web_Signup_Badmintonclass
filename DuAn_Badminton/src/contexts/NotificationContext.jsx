import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

const NotificationCtx = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/api/me/notifications");
      const list = Array.isArray(res?.data) ? res.data : [];
      setNotifications(list.slice(0, 10));
    } catch (err) {
      console.error("fetchNotifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    else setNotifications([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addNotification = (notif) => {
    setNotifications((prev) => {
      const next = [
        {
          id: `local-${Date.now()}`,
          title: notif?.title || "Thông báo",
          body: notif?.body || "",
          created_at: new Date().toISOString(),
          is_read: false,
        },
        ...prev,
      ];
      return next.slice(0, 10);
    });
  };

  const markAsRead = async (ids) => {
    if (!user || !Array.isArray(ids) || !ids.length) return;
    try {
      await api.post("/api/me/notifications/read", { ids });
      setNotifications((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      console.error("markAsRead", err);
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      loading,
      fetchNotifications,
      addNotification,
      markAsRead,
    }),
    [notifications, loading]
  );

  return (
    <NotificationCtx.Provider value={value}>
      {children}
    </NotificationCtx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationCtx);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
