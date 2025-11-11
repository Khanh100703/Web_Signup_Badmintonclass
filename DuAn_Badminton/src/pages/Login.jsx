// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const out = await login(email, password);
    if (out.ok) nav("/");
    else setErr(out.message || "Sai email/mật khẩu");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6">Đăng nhập</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <input
          className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/50"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90 hover:scale-[1.02] transition-all">
          Đăng nhập
        </button>
        <div className="text-sm text-gray-600 flex gap-3">
          <Link to="/forgot-password" className="link-underline">
            Quên mật khẩu?
          </Link>
          <Link to="/register" className="link-underline">
            Đăng ký
          </Link>
        </div>
      </form>
    </div>
  );
}
