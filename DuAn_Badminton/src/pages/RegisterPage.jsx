import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });
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
      await register(form);
      setSuccess("Đăng ký thành công! Chào mừng bạn đến với Badminton Academy");
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      setError(err.message || "Không thể đăng ký");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Đăng ký tài khoản</h2>
        <p>Đăng ký ngay để giữ chỗ cho lớp cầu lông yêu thích của bạn.</p>
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
            Họ và tên
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="Nguyễn Văn A"
            />
          </label>
          <label>
            Số điện thoại
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0909 123 456"
            />
          </label>
          <label>
            Email công ty
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
              minLength={6}
              placeholder="Tối thiểu 6 ký tự"
            />
          </label>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Tạo tài khoản"}
          </button>
        </form>
        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
