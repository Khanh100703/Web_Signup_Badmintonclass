import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const GENDER_OPTIONS = [
  { value: "UNSPECIFIED", label: "Không xác định" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

export default function ProfilePage() {
  const { refreshUser, updateUserLocal } = useAuth();
  const { addNotification, fetchNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "UNSPECIFIED",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get("/api/users/me");
        if (!active) return;
        if (res?.ok && res.data) {
          const data = res.data;
          setForm({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            date_of_birth: data.date_of_birth || "",
            gender: data.gender || "UNSPECIFIED",
          });
          updateUserLocal({
            name: data.name,
            email: data.email,
          });
        } else {
          setError(res?.message || "Không tải được thông tin người dùng");
        }
      } catch (err) {
        setError(err?.message || "Không tải được thông tin người dùng");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || "UNSPECIFIED",
      };
      const res = await api.put("/api/users/me", payload);
      if (res?.ok) {
        setMessage("Cập nhật thông tin thành công");
        await refreshUser();
        fetchNotifications();
        addNotification({
          title: "Hồ sơ",
          body: "Bạn đã cập nhật thông tin cá nhân thành công.",
        });
      } else {
        setError(res?.message || "Không thể cập nhật thông tin");
      }
    } catch (err) {
      setError(err?.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-500">
            Smash Your Limits
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-800">
            Thông tin cá nhân
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Giữ cho hồ sơ của bạn luôn chính xác để trải nghiệm lớp học tốt nhất.
          </p>
        </div>

        <div className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-blue-100/70 backdrop-blur">
          {loading ? (
            <p className="text-center text-sm text-slate-500">
              Đang tải thông tin...
            </p>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Họ tên
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-base text-slate-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Email
                  <input
                    name="email"
                    value={form.email}
                    disabled
                    className="rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-base text-slate-500"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Số điện thoại
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-base text-slate-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Địa chỉ
                  <input
                    name="address"
                    value={form.address}
                    onChange={onChange}
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-base text-slate-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Ngày sinh
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth || ""}
                    onChange={onChange}
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-base text-slate-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                  Giới tính
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={onChange}
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-base text-slate-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-inner">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 shadow-inner">
                  {message}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Stay Active · Play Smart · Smash Hard
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:scale-[1.02] hover:shadow-xl disabled:opacity-70"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
