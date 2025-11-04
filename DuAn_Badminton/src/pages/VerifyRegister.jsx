// src/pages/VerifyRegister.jsx
import { useState } from "react";
import { api } from "../services/api.js";
import { useNavigate } from "react-router-dom";

export default function VerifyRegister() {
  const nav = useNavigate();
  const email = localStorage.getItem("verify_email") || "";
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!otp || otp.length !== 6) return setErr("OTP phải 6 ký tự.");

    const res = await api.post("/api/users/verify-register-otp", {
      email,
      otp,
    });
    if (res.ok) {
      localStorage.removeItem("verify_email"); // xoá khi xác minh xong
      setOk("Xác minh thành công! Mời đăng nhập.");
      setTimeout(() => nav("/login"), 1000);
    } else {
      setErr(res.message || "Có lỗi xảy ra.");
    }
  }

  async function resend() {
    setErr("");
    setOk("");
    const res = await api.post("/api/users/resend-register-otp", { email });
    if (res.ok) setOk("Đã gửi lại OTP (kiểm tra email).");
    else setErr(res.message || "Không gửi lại được OTP.");
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Xác minh đăng ký (OTP)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="OTP 6 ký tự"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        <button className="px-4 py-3 rounded-2xl bg-black text-white w-full">
          Xác minh
        </button>
      </form>
      <button onClick={resend} className="mt-3 text-sm underline">
        Gửi lại OTP
      </button>
    </div>
  );
}
