// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    const res = await api.post("/api/users/register", {
      name,
      email,
      password,
    });
    if (res.ok) {
      setOk("Đăng ký thành công! Vui lòng đăng nhập.");
      setTimeout(() => nav("/login"), 800);
    } else {
      setErr(res.message || "Đăng ký thất bại");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6">Tạo tài khoản</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <input
          className="border rounded-xl px-4 py-3"
          placeholder="Họ tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded-xl px-4 py-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded-xl px-4 py-3"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        <button className="px-4 py-3 rounded-2xl bg-black text-white">
          Đăng ký
        </button>
        <p className="text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
