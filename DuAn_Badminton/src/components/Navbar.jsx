import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Khi cuộn trang, thêm hiệu ứng thu nhỏ / bóng đổ
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-white shadow-md py-2"
          : "bg-white/80 backdrop-blur-md py-3"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Logo / Tên trang */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-gray-800 hover:scale-105 transition-transform"
        >
          SmashBadminton
        </Link>

        {/* Menu */}
        <nav className="flex items-center gap-6 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hover:text-black transition ${
                isActive ? "font-semibold text-black" : "text-gray-700"
              }`
            }
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/classes"
            className={({ isActive }) =>
              `hover:text-black transition ${
                isActive ? "font-semibold text-black" : "text-gray-700"
              }`
            }
          >
            Khóa học
          </NavLink>
          <NavLink
            to="/coaches"
            className={({ isActive }) =>
              `hover:text-black transition ${
                isActive ? "font-semibold text-black" : "text-gray-700"
              }`
            }
          >
            Huấn luyện viên
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `hover:text-black transition ${
                isActive ? "font-semibold text-black" : "text-gray-700"
              }`
            }
          >
            Liên hệ
          </NavLink>

          {/* Role-based items */}
          {user?.role === "USER" && (
            <NavLink
              to="/me/schedule"
              className={({ isActive }) =>
                `hover:text-black transition ${
                  isActive ? "font-semibold text-black" : "text-gray-700"
                }`
              }
            >
              Lịch học của tôi
            </NavLink>
          )}
          {user?.role === "COACH" && (
            <NavLink
              to="/coach/classes"
              className={({ isActive }) =>
                `hover:text-black transition ${
                  isActive ? "font-semibold text-black" : "text-gray-700"
                }`
              }
            >
              Lớp của tôi
            </NavLink>
          )}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `hover:text-black transition ${
                  isActive ? "font-semibold text-black" : "text-gray-700"
                }`
              }
            >
              Quản trị
            </NavLink>
          )}
        </nav>

        {/* User actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-700">
                Xin chào, <b>{user.name}</b>
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-xl border border-black hover:shadow hover:scale-105 transition-all duration-200"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl border border-black hover:shadow hover:scale-105 transition-all duration-200"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 hover:scale-105 transition-all duration-200"
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
