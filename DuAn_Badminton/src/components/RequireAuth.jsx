// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();

  // Chưa login → quay về /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Có truyền roles (ví dụ ["ADMIN"]) thì kiểm tra quyền
  if (roles && roles.length > 0) {
    const currentRole = (user.role || "").toUpperCase();
    const allowed = roles.map((r) => r.toUpperCase());

    if (!allowed.includes(currentRole)) {
      // Đăng nhập nhưng không đủ quyền → đưa về trang chủ
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
