import { useState } from "react";
import { api } from "../services/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      if (res?.ok)
        setMsg("Đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn.");
      else setErr(res?.message || "Không gửi được email.");
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setErr("Lỗi máy chủ");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6">Quên mật khẩu</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <input
          className="border rounded-xl px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {msg && <div className="text-emerald-600 text-sm">{msg}</div>}
        <button className="px-4 py-3 rounded-2xl bg-black text-white">
          Gửi hướng dẫn
        </button>
      </form>
    </div>
  );
}
