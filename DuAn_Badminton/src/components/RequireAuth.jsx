import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (Array.isArray(roles) && roles.length > 0) {
    if (!roles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
