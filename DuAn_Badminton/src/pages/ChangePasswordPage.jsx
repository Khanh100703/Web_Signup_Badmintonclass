import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const { addNotification, fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [changing, setChanging] = useState(false);
  const [form, setForm] = useState({
    email: "",
    currentPassword: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.email) setForm((prev) => ({ ...prev, email: user.email }));
  }, [user?.email]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    setLoadingOtp(true);
    setError("");
    setStepMessage("");
    try {
      const res = await api.post("/api/auth/request-change-password-otp", {
        email: form.email,
        current_password: form.currentPassword,
      });
      if (res?.ok) {
        setOtpSent(true);
        setStepMessage(res?.message || "Đã gửi OTP tới email");
      } else {
        setError(res?.message || "Không thể gửi OTP");
      }
    } catch (err) {
      setError(err?.message || "Không thể gửi OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!otpSent) {
      setError("Hãy gửi và nhập mã OTP trước khi đổi mật khẩu");
      return;
    }
    if (!form.otp || form.otp.length !== 6) {
      setError("Mã OTP gồm 6 chữ số");
      return;
    }
    if (!form.newPassword || form.newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    setChanging(true);
    setError("");
    setStepMessage("");
    try {
      const res = await api.post("/api/auth/change-password-with-otp", {
        email: form.email,
        otp: form.otp,
        new_password: form.newPassword,
      });
      if (res?.ok) {
        addNotification({
          title: "Đổi mật khẩu",
          body: "Bạn vừa đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
        });
        fetchNotifications();
        setStepMessage("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 1200);
      } else {
        setError(res?.message || "Không thể đổi mật khẩu");
      }
    } catch (err) {
      setError(err?.message || "Không thể đổi mật khẩu");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-700 py-14 text-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-3xl bg-white/10 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.6em] text-emerald-200">
              Secure Your Game
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              Đổi mật khẩu với OTP
            </h1>
            <p className="mt-2 text-sm text-blue-100">
              Nhập mật khẩu hiện tại để nhận OTP và thiết lập lại mật khẩu thật mạnh mẽ.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleChangePassword}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-blue-100">
                Email
                <input
                  name="email"
                  value={form.email}
                  disabled
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white shadow-inner focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-blue-100">
                Mật khẩu hiện tại
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={onChange}
                  required
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                    Bước 1
                  </p>
                  <p className="text-sm text-blue-100/90">
                    Gửi OTP về email đã đăng ký
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loadingOtp || !form.currentPassword}
                  className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] disabled:opacity-60"
                >
                  {loadingOtp ? "Đang gửi..." : otpSent ? "Gửi lại OTP" : "Gửi OTP"}
                </button>
              </div>
              {stepMessage && (
                <p className="rounded-2xl bg-emerald-50/20 px-4 py-2 text-sm text-emerald-100">
                  {stepMessage}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-semibold text-blue-100">
                Mã OTP
                <input
                  name="otp"
                  value={form.otp}
                  onChange={onChange}
                  placeholder="Nhập 6 chữ số"
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-blue-100 md:col-span-1">
                Mật khẩu mới
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={onChange}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-blue-100 md:col-span-1">
                Xác nhận mật khẩu
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
              </label>
            </div>

            {error && (
              <p className="rounded-2xl bg-rose-50/20 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-100/70">
                Protect · Reset · Triumph
              </p>
              <button
                type="submit"
                disabled={changing}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-6 py-3 text-sm font-semibold text-emerald-600 shadow-xl shadow-emerald-900/30 transition hover:scale-[1.03] hover:bg-white disabled:opacity-70"
              >
                {changing ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
