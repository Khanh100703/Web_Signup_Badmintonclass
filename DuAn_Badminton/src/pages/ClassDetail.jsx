import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Link } from "react-router-dom";

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [clazz, setClazz] = useState(null);
  const [coach, setCoach] = useState(null);
  const [location, setLocation] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [enrolling, setEnrolling] = useState(null);
  const [myEnrolled, setMyEnrolled] = useState(new Set());

  const capacity = useMemo(
    () => clazz?.capacity ?? clazz?.max_capacity ?? null,
    [clazz]
  );
  const price = useMemo(() => clazz?.price ?? clazz?.tuition ?? null, [clazz]);
  const level = useMemo(
    () => clazz?.level ?? clazz?.difficulty ?? clazz?.level?.name ?? null,
    [clazz]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) class detail
        const res1 = await api.get(`/api/classes/${id}`);
        const c = res1?.data || res1 || null;
        if (!mounted) return;
        if (!c) throw new Error("Không tìm thấy lớp học");
        setClazz(c);

        // 2) sessions by class (không crash nếu lỗi)
        try {
          const res2 = await api.get(`/api/sessions/class/${id}`);
          if (!mounted) return;
          const arr = Array.isArray(res2) ? res2 : res2?.data || [];
          setSessions(arr);
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          if (mounted) setSessions([]);
        }

        // 3) coach: ưu tiên dữ liệu embed; nếu không có mà có coach_id thì gọi API riêng
        try {
          if (c?.coach) {
            if (mounted) setCoach(c.coach);
          } else if (c?.coach_id) {
            // 🚩 ĐẢM BẢO đúng route backend: /api/coaches/:id hay /api/coach/:id ?
            const coachRes = await api.get(`/api/coaches/${c.coach_id}`);
            if (mounted) setCoach(coachRes?.data || coachRes || null);
          }
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          if (mounted) setCoach(null);
        }

        // 4) location (nếu có)
        try {
          if (c?.location_id) {
            const locRes = await api.get(`/api/locations/${c.location_id}`);
            if (mounted) setLocation(locRes?.data || locRes || null);
          }
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          if (mounted) setLocation(null);
        }

        // 5) danh sách session_id user đã đăng ký (để disable nút)
        try {
          if (user) {
            const r = await api.get(`/api/enrollments/my?class_id=${id}`);
            if (mounted) setMyEnrolled(new Set(r?.session_ids || []));
          } else if (mounted) {
            setMyEnrolled(new Set());
          }
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          if (mounted) setMyEnrolled(new Set());
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

  async function enroll(session_id) {
    setEnrolling(session_id);
    try {
      const out = await api.post("/api/enrollments", { session_id });
      if (out?.ok) setMyEnrolled((prev) => new Set(prev).add(session_id));
      alert(
        out?.message ||
          (out?.waitlisted ? "Đã đưa vào danh sách chờ" : "Đăng ký thành công")
      );
    } finally {
      setEnrolling(null);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-4">
      {/* nút quay lại */}
      <div className="lg:col-span-2 -mt-6 mb-0">
        <Link
          to="/classes"
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border hover:shadow"
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
          <h1 className="text-3xl font-bold">{clazz.title || "Khóa học"}</h1>
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
                <div className="font-semibold">{capacity} học viên</div>
              </div>
            )}
            {price && (
              <div className="rounded-xl border p-4">
                <div className="text-gray-500">Học phí</div>
                <div className="font-semibold">{price}</div>
              </div>
            )}
            {(clazz.start_date || clazz.end_date) && (
              <div className="rounded-xl border p-4">
                <div className="text-gray-500">Thời gian khóa</div>
                <div className="font-semibold">
                  {clazz.start_date
                    ? new Date(clazz.start_date).toLocaleDateString("vi-VN")
                    : "Chưa xác định"}
                  {clazz.end_date
                    ? ` - ${new Date(clazz.end_date).toLocaleDateString("vi-VN")}`
                    : ""}
                </div>
              </div>
            )}
            {location && (
              <div className="rounded-xl border p-4 sm:col-span-2">
                <div className="text-gray-500">Địa điểm</div>
                <div className="font-semibold">
                  {location?.name || "Sân tập"}
                  {location?.address ? ` – ${location.address}` : ""}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SESSIONS */}
        <div className="mt-8 rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Bắt đầu</th>
                <th className="text-left p-3">Kết thúc</th>
                <th className="text-left p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const disabled = enrolling === s.id || myEnrolled.has(s.id);
                return (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">
                      {s?.start_time
                        ? new Date(s.start_time).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      {s?.end_time
                        ? new Date(s.end_time).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => enroll(s.id)}
                        className="px-3 py-2 rounded-xl border hover:shadow disabled:opacity-60"
                        disabled={disabled}
                      >
                        {myEnrolled.has(s.id)
                          ? "Đã đăng ký"
                          : enrolling === s.id
                          ? "Đang đăng ký…"
                          : "Đăng ký"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!sessions.length && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={3}>
                    Chưa có lịch cho khóa này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: COACH */}
      <aside className="lg:col-span-1">
        <div className="rounded-2xl border p-6">
          <div className="text-lg font-semibold mb-4">Huấn luyện viên</div>
          {coach || clazz?.coach ? (
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-100" />
              <div>
                <div className="font-semibold">
                  {(coach || clazz.coach).name}
                </div>
                {(coach || clazz.coach).email && (
                  <div className="text-sm text-gray-600">
                    {(coach || clazz.coach).email}
                  </div>
                )}
                {(coach || clazz.coach).phone && (
                  <div className="text-sm text-gray-600">
                    ☎ {(coach || clazz.coach).phone}
                  </div>
                )}
                <a
                  href="/coaches"
                  className="text-sm underline mt-2 inline-block"
                >
                  Xem tất cả HLV
                </a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Khóa học chưa gán huấn luyện viên.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
