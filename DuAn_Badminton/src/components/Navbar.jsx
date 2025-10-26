import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          Học Cầu Lông
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "font-semibold" : "")}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/classes"
            className={({ isActive }) => (isActive ? "font-semibold" : "")}
          >
            Khóa học
          </NavLink>
          <NavLink
            to="/coaches"
            className={({ isActive }) => (isActive ? "font-semibold" : "")}
          >
            Huấn luyện viên
          </NavLink>
          {user && (
            <NavLink
              to="/me/schedule"
              className={({ isActive }) => (isActive ? "font-semibold" : "")}
            >
              Lịch học của tôi
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm">
                Xin chào, <b>{user.name}</b>
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-xl border hover:shadow"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl border hover:shadow"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
