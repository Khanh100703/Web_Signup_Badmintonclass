import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await login(form);
      setSuccess("Đăng nhập thành công!");
      const from = location.state?.from?.pathname || "/";
      setTimeout(() => navigate(from, { replace: true }), 600);
    } catch (err) {
      setError(err.message || "Không thể đăng nhập");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Đăng nhập</h2>
        <p>Chào mừng bạn quay trở lại sân cầu lông sôi động.</p>
        <FeedbackMessage
          type={error ? "error" : "success"}
          message={error || success}
          onClose={() => {
            setError("");
            setSuccess("");
          }}
        />
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="nhanvien@congty.com"
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••"
            />
          </label>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
