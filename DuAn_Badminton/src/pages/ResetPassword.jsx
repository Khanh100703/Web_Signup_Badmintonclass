import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = useMemo(() => sp.get("token") || "", [sp]);
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!token) return setErr("Thiếu token đặt lại mật khẩu.");
    if (password.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự.");
    if (password !== confirm) return setErr("Mật khẩu nhập lại không khớp.");

    try {
      const res = await api.post("/api/auth/reset-password", {
        token,
        password,
      });
      if (res?.ok) {
        setOk("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        setTimeout(() => nav("/login"), 1000);
      } else setErr(res?.message || "Đặt lại mật khẩu thất bại.");
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setErr("Lỗi máy chủ");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6">Đặt lại mật khẩu</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <input
          className="border rounded-xl px-4 py-3"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <input
          className="border rounded-xl px-4 py-3"
          placeholder="Nhập lại mật khẩu"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        <button className="px-4 py-3 rounded-2xl bg-black text-white">
          Xác nhận
        </button>
      </form>
    </div>
  );
}
