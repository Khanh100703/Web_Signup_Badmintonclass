import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const baseLinkClass =
  "relative text-sm font-medium transition-colors duration-200 text-slate-100/80 hover:text-white";

function BellIcon({ filled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={`h-5 w-5 ${filled ? "text-emerald-300" : "text-white"}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 18.75a2.25 2.25 0 01-4.5 0M4.5 9.75a7.5 7.5 0 1115 0c0 1.914.555 3.161 1.05 3.946.322.513.482.77.469.984-.015.247-.156.478-.428.786-.671.744-1.988 1.284-4.041 1.284H7.45c-2.053 0-3.37-.54-4.04-1.284-.273-.308-.414-.539-.43-.786-.012-.214.148-.47.47-.984.494-.785 1.05-2.032 1.05-3.946z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5a7.5 7.5 0 0115 0"
      />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const unreadIds = notifications
    .filter((item) => !item.is_read && !String(item.id).startsWith("local-"))
    .map((item) => item.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const onToggleNotif = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && unreadIds.length) markAsRead(unreadIds);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg" : "shadow-md"
      }`}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-emerald-600 to-blue-700" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-black tracking-tight text-white drop-shadow-sm hover:scale-[1.02] transition-transform"
          >
            SmashBadminton
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? "text-white" : ""}`
              }
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/classes"
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? "text-white" : ""}`
              }
            >
              Khóa học
            </NavLink>
            <NavLink
              to="/coaches"
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? "text-white" : ""}`
              }
            >
              Huấn luyện viên
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? "text-white" : ""}`
              }
            >
              Liên hệ
            </NavLink>
            {user?.role === "USER" && (
              <NavLink
                to="/me/schedule"
                className={({ isActive }) =>
                  `${baseLinkClass} ${isActive ? "text-white" : ""}`
                }
              >
                Lịch học của tôi
              </NavLink>
            )}
            {user?.role === "COACH" && (
              <NavLink
                to="/coach/classes"
                className={({ isActive }) =>
                  `${baseLinkClass} ${isActive ? "text-white" : ""}`
                }
              >
                Lớp của tôi
              </NavLink>
            )}
            {user?.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${baseLinkClass} ${isActive ? "text-white" : ""}`
                }
              >
                Quản trị
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3 text-white">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={onToggleNotif}
                  ref={notifRef}
                  className="relative flex items-center justify-center rounded-full bg-white/10 p-2 hover:bg-white/20 transition-transform hover:scale-105"
                  title="Thông báo"
                >
                  <BellIcon filled={unreadIds.length > 0} />
                  {unreadIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {unreadIds.length}
                    </span>
                  )}
                  {notifOpen && (
                    <div className="absolute right-0 top-11 w-72 rounded-2xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-blue-100/80 p-3 text-left">
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                        Thông báo gần đây
                      </p>
                      <div className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                        {notifications.length === 0 && (
                          <p className="text-sm text-slate-500">
                            Chưa có thông báo nào.
                          </p>
                        )}
                        {notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-xl border border-blue-100/60 bg-white/90 px-3 py-2 shadow-sm ${
                              item.is_read ? "opacity-80" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-blue-700">
                                {item.title || "Thông báo"}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                                {item.created_at
                                  ? new Date(item.created_at).toLocaleString(
                                      "vi-VN",
                                      { hour12: false }
                                    )
                                  : ""}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                              {item.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="group flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 pr-2 text-left shadow-sm ring-1 ring-white/20 transition hover:bg-white/20"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-bold uppercase text-white">
                      {user.name?.slice(0, 1) || <UserIcon />}
                    </span>
                    <span className="hidden text-sm md:block">
                      <span className="text-white/80">Xin chào, </span>
                      <span className="font-semibold text-white">
                        {user.name || "User"}
                      </span>
                    </span>
                    <svg
                      className="h-4 w-4 text-white/80"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M6 8l4 4 4-4" strokeWidth={1.6} strokeLinecap="round" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-3 w-52 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-emerald-100">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/profile");
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span role="img" aria-label="profile">
                          🏸
                        </span>
                        Thông tin cá nhân
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/change-password");
                          setMenuOpen(false);
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span role="img" aria-label="shield">
                          🔐
                        </span>
                        Đổi mật khẩu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <span role="img" aria-label="logout">
                          🚪
                        </span>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 hover:shadow-lg"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-lg shadow-emerald-900/30 transition hover:scale-105 hover:bg-emerald-50"
                >
                  Tham gia ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
