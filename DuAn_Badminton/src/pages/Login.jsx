// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Nếu đã đăng nhập sẵn thì tự điều hướng theo role
  useEffect(() => {
    if (!user) return;

    const role = user.role;
    if (role === "ADMIN") {
      navigate("/admin", { replace: true });
    } else if (role === "COACH") {
      navigate("/coach/classes", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await login(email, password);

      if (!res || res.ok === false) {
        setError(res?.message || "Đăng nhập thất bại");
        return;
      }

      // Cố gắng lấy role từ nhiều dạng response khác nhau
      const role =
        res.user?.role || res.data?.user?.role || res.data?.role || res.role;

      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (role === "COACH") {
        navigate("/coach/classes", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError("Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">
          Đăng nhập
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Sử dụng tài khoản đã đăng ký tại SmashBadminton.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-700"
            >
              Quên mật khẩu?
            </Link>
            <Link to="/register" className="text-blue-600 hover:text-blue-700">
              Đăng ký ngay
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
