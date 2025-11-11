// src/pages/Contact.jsx
import { useState } from "react";
import { api } from "../services/api";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    const res = await api.post("/api/contacts", {
      name,
      email,
      subject,
      message,
    });
    if (res.ok) {
      setOk("Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } else {
      setErr(res.message || "Gửi không thành công.");
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Liên hệ</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/50"
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <input
          className="w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/50"
          placeholder="Tiêu đề"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/50"
          placeholder="Nội dung"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        <button className="px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90 hover:scale-[1.02] transition-all">
          Gửi
        </button>
      </form>
    </div>
  );
}
