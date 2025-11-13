import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [clazz, setClazz] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledThisClass, setEnrolledThisClass] = useState(false);

  const capacity = useMemo(() => clazz?.capacity ?? null, [clazz]);
  const price = useMemo(() => clazz?.price ?? null, [clazz]);
  const level = useMemo(
    () => clazz?.level ?? clazz?.level?.name ?? null,
    [clazz]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Backend wrapper fetch: { ok:true, data:{...} }
        const res1 = await api.get(`/api/classes/${id}`);
        const c = res1?.data ?? null;
        if (!c) throw new Error("Không tìm thấy lớp học");
        if (!mounted) return;

        setClazz(c);
        setSessions(Array.isArray(c.sessions) ? c.sessions : []);

        // Đã đăng ký lớp này chưa?
        if (user) {
          try {
            const r = await api.get(`/api/enrollments/my`);
            const arr = Array.isArray(r?.data) ? r.data : [];
            const enrolled = arr.some(
              (e) =>
                Number(e.class_id) === Number(id) &&
                ["PENDING_PAYMENT", "PAID", "WAITLIST"].includes(e.status)
            );
            if (mounted) setEnrolledThisClass(enrolled);
          } catch {
            if (mounted) setEnrolledThisClass(false);
          }
        } else {
          setEnrolledThisClass(false);
        }
      } catch (e) {
        if (mounted) setErr(e?.message || "Không tải được chi tiết lớp");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, user]);

  async function enrollClass() {
    setEnrolling(true);
    try {
      const out = await api.post("/api/enrollments", { class_id: Number(id) });
      const ok = !!out?.ok;
      const message =
        out?.message || (ok ? "Đăng ký thành công" : "Không thể đăng ký");
      if (ok) {
        setEnrolledThisClass(true);
        alert(message);
      } else {
        alert(message);
      }
    } catch (e) {
      alert(e?.message || "Không thể đăng ký");
    } finally {
      setEnrolling(false);
    }
  }

  if (loading)
    return <div className="max-w-6xl mx-auto px-4 py-10">Đang tải…</div>;
  if (err)
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-red-600">{err}</div>
    );
  if (!clazz)
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        Không tìm thấy khóa học
      </div>
    );

  const seatsLeft =
    typeof clazz.seats_remaining === "number" ? clazz.seats_remaining : null;
  const canEnroll =
    !!user && !enrolledThisClass && (seatsLeft === null || seatsLeft > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 -mt-6 mb-0">
        <Link
          to="/classes"
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border hover:shadow hover:scale-[1.02] transition"
        >
          ← Quay lại danh sách khóa học
        </Link>
      </div>

      {/* LEFT */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border p-6">
          {clazz.image_url && (
            <div className="mb-6 rounded-2xl overflow-hidden bg-gray-100 aspect-video">
              <img
                src={clazz.image_url}
                alt={clazz.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold">{clazz.title || "Khóa học"}</h1>
            <button
              onClick={enrollClass}
              disabled={!canEnroll || enrolling}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              title={!user ? "Hãy đăng nhập để đăng ký" : ""}
            >
              {enrolledThisClass
                ? "Đã đăng ký"
                : enrolling
                ? "Đang đăng ký…"
                : "Đăng ký"}
            </button>
          </div>

          {level && (
            <div className="mt-2 inline-block text-xs px-2 py-1 rounded-full bg-gray-100">
              Trình độ: {typeof level === "object" ? level?.name : level}
            </div>
          )}

          <p className="mt-4 text-gray-700 whitespace-pre-line">
            {clazz.description || "Khóa học cầu lông dành cho mọi lứa tuổi."}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
            {capacity !== null && (
              <div className="rounded-xl border p-4">
                <div className="text-gray-500">Sức chứa</div>
                <div className="font-semibold">
                  {capacity} học viên
                  {seatsLeft !== null && (
                    <span className="text-gray-500 font-normal">
                      {" "}
                      — còn {seatsLeft}
                    </span>
                  )}
                </div>
              </div>
            )}
            {price && (
              <div className="rounded-xl border p-4">
                <div className="text-gray-500">Học phí</div>
                <div className="font-semibold">{price}</div>
              </div>
            )}
          </div>
        </div>

        {/* LỊCH BUỔI */}
        <div className="mt-8 rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Bắt đầu</th>
                <th className="text-left p-3">Kết thúc</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">
                    {s?.start_time
                      ? new Date(s.start_time).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td className="p-3">
                    {s?.end_time
                      ? new Date(s.end_time).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                </tr>
              ))}
              {!sessions.length && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={2}>
                    Chưa có lịch cho khóa này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HLV / ĐỊA ĐIỂM từ clazz */}
      <aside className="lg:col-span-1">
        <div className="rounded-2xl border p-6">
          <div className="text-lg font-semibold mb-4">Huấn luyện viên</div>
          {clazz?.coach ? (
            <div className="flex gap-4 items-center">
              {clazz.coach.photo_url ? (
                <img
                  src={clazz.coach.photo_url}
                  alt={clazz.coach.name || "Coach"}
                  className="w-20 h-20 rounded-full object-cover border"
                  loading="lazy"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold">{clazz.coach.name}</div>
                {clazz.coach.email && (
                  <div className="text-sm text-gray-600">
                    {clazz.coach.email}
                  </div>
                )}
                {clazz.coach.phone && (
                  <div className="text-sm text-gray-600">
                    ☎ {clazz.coach.phone}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Khóa học chưa gán huấn luyện viên.
            </div>
          )}

          {clazz?.location && (
            <div className="mt-6">
              <div className="text-lg font-semibold mb-2">Địa điểm</div>
              <div className="text-sm">
                <b>{clazz.location.name}</b>
                {clazz.location.address ? ` — ${clazz.location.address}` : ""}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
