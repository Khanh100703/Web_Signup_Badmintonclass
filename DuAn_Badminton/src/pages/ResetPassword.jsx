// DuAn_Badminton/src/pages/ResetPassword.jsx
import { useState } from "react";
import { api } from "../services/api.js";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!email) return setErr("Vui lòng nhập email.");
    if (!otp || otp.length !== 6) return setErr("OTP phải gồm 6 ký tự.");

    try {
      const res = await api.post("/api/users/reset-password", { email, otp });
      if (res?.ok) {
        setOk(
          "Đặt lại mật khẩu thành công! Vui lòng kiểm tra email để nhận mật khẩu mới."
        );
      } else {
        setErr(res?.message || "Có lỗi xảy ra.");
      }
    } catch (e) {
      setErr(e?.message || "Lỗi máy chủ.");
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Đặt lại mật khẩu (OTP)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Email đã đăng ký"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="OTP (6 ký tự)"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
        />

        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}

        <button className="px-4 py-3 rounded-2xl bg-black text-white w-full">
          Xác nhận
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-3">
        Mẹo: Kiểm tra mục Spam/Promotions nếu chưa thấy email.
      </p>
    </div>
  );
}
