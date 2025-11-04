import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
