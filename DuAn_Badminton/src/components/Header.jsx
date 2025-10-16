import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { path: "/", label: "Lớp học" },
  { path: "/schedule", label: "Lịch của tôi", protected: true },
];

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div
          className="logo"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
        >
          <span className="logo-accent">Badminton</span>
          <span className="logo-text">Academy</span>
        </div>
        <nav className="main-nav">
          {navItems.map((item) => {
            if (item.protected && !isAuthenticated) return null;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                end={item.path === "/"}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="auth-actions">
          {isAuthenticated ? (
            <div className="auth-user">
              <span className="avatar-circle">
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </span>
              <div className="auth-user-info">
                <p className="auth-name">{user?.full_name}</p>
                <button type="button" onClick={handleLogout} className="link">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate("/register")}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
