import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);
  const lastReqId = useRef(0);

  // Kiểm tra mật khẩu mạnh
  function isStrongPassword(pw) {
    return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}/.test(pw);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (pending) return;

    setErr("");
    setOk("");

    if (!name || !email || !password) {
      return setErr("Vui lòng nhập đầy đủ thông tin.");
    }

    if (!isStrongPassword(password)) {
      return setErr(
        "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
      );
    }

    setPending(true);
    const reqId = ++lastReqId.current;

    try {
      const res = await api.post("/api/users/register", {
        name,
        email,
        password,
      });

      // Nếu đây không phải request mới nhất => bỏ qua
      if (reqId !== lastReqId.current) return;

      if (res.ok) {
        localStorage.setItem("verify_email", email);
        setOk(
          "Đăng ký thành công! Vui lòng kiểm tra email để nhập OTP xác minh."
        );
        setErr("");
        setTimeout(() => nav("/verify"), 900);
      } else {
        const msg =
          (Array.isArray(res?.errors) && res.errors[0]?.msg) ||
          res?.message ||
          "Có lỗi xảy ra.";
        setErr(msg);
        setOk("");
      }
    } catch (ex) {
      if (reqId !== lastReqId.current) return;
      setErr(ex?.message || "Lỗi máy chủ.");
      setOk("");
    } finally {
      if (reqId === lastReqId.current) setPending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Đăng ký tài khoản</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErr("");
            setOk("");
          }}
        />
        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErr("");
            setOk("");
          }}
        />
        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErr("");
            setOk("");
          }}
        />

        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}

        <button
          disabled={pending}
          className={`px-4 py-3 rounded-2xl text-white w-full ${
            pending ? "bg-gray-500" : "bg-black hover:bg-gray-800"
          }`}
        >
          {pending ? "Đang gửi..." : "Đăng ký"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <span
          className="text-blue-600 cursor-pointer underline"
          onClick={() => nav("/login")}
        >
          Đăng nhập
        </span>
      </p>
    </div>
  );
}
