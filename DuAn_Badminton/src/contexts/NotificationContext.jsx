import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

const NotificationCtx = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
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
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNotifications();
    else setNotifications([]);
  }, [userId, fetchNotifications]);

  const addNotification = useCallback((notif) => {
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
  }, []);

  const markAsRead = useCallback(
    async (ids) => {
      if (!userId || !Array.isArray(ids) || !ids.length) return;
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
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      notifications,
      loading,
      fetchNotifications,
      addNotification,
      markAsRead,
    }),
    [notifications, loading, fetchNotifications, addNotification, markAsRead]
  );

  return (
    <NotificationCtx.Provider value={value}>
      {children}
    </NotificationCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationCtx);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
}
