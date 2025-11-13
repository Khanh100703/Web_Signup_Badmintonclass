import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification, fetchNotifications } = useNotifications();

  const [clazz, setClazz] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [classEnrollment, setClassEnrollment] = useState(null);

  // 👉 thêm state chọn ngày
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingMap, setBookingMap] = useState({});
  const [bookingBusyId, setBookingBusyId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  const capacity = clazz?.capacity ?? null;
  const price = clazz?.price ?? null;
  const level = clazz?.level?.name ?? clazz?.level ?? null;
  const priceDisplay =
    typeof price === "number"
      ? price.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          minimumFractionDigits: 0,
        })
      : price;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
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
            const enrollment = arr.find(
              (e) => Number(e.class_id) === Number(id)
            );
            if (mounted) setClassEnrollment(enrollment || null);
          } catch {
            if (mounted) setClassEnrollment(null);
          }
        } else {
          setClassEnrollment(null);
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

  useEffect(() => {
    if (!user || classEnrollment?.status !== "PAID") {
      setBookingMap({});
      setBookingMessage("");
      setBookingError("");
      return;
    }

    let active = true;
    const loadBookings = async () => {
      setBookingMessage("");
      setBookingError("");
      try {
        const res = await api.get(
          `/api/sessions/class/${id}/my-bookings`
        );
        if (!active) return;
        if (res?.ok) {
          const list = Array.isArray(res?.data) ? res.data : [];
          const nextMap = {};
          for (const item of list) {
            if (item?.session_id) {
              nextMap[item.session_id] = item.status || "BOOKED";
            }
          }
          setBookingMap(nextMap);
        } else {
          setBookingError(
            res?.message || "Không thể tải danh sách buổi đã đăng ký"
          );
        }
      } catch (error) {
        if (active)
          setBookingError(
            error?.message || "Không thể tải danh sách buổi đã đăng ký"
          );
      }
    };

    loadBookings();
    return () => {
      active = false;
    };
  }, [user, id, classEnrollment?.status]);

  function handleCheckout() {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    navigate(`/classes/${id}/checkout`);
  }

  const handleBookSession = async (sessionId) => {
    if (!sessionId || !showSessionBooking) return;
    setBookingBusyId(sessionId);
    setBookingError("");
    setBookingMessage("");
    try {
      const res = await api.post(`/api/sessions/${sessionId}/book`);
      if (res?.ok) {
        setBookingMap((prev) => ({ ...prev, [sessionId]: "BOOKED" }));
        const target = sessions.find(
          (s) => Number(s.id) === Number(sessionId)
        );
        const whenLabel = target?.start_time
          ? new Date(target.start_time).toLocaleString("vi-VN", {
              hour12: false,
            })
          : "";
        const successMsg = res?.message || "Đăng ký buổi học thành công";
        setBookingMessage(whenLabel ? `${successMsg} (${whenLabel})` : successMsg);
        addNotification({
          title: "Đăng ký buổi học",
          body: whenLabel
            ? `Bạn đã đăng ký buổi học vào ${whenLabel}. Hẹn gặp bạn trên sân!`
            : "Bạn đã đăng ký tham gia một buổi học.",
        });
        fetchNotifications();
      } else {
        setBookingError(res?.message || "Không thể đăng ký buổi học");
      }
    } catch (error) {
      setBookingError(error?.message || "Không thể đăng ký buổi học");
    } finally {
      setBookingBusyId(null);
    }
  };

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
  const enrollmentStatus = classEnrollment?.status || null;
  const hasEnrollment = Boolean(classEnrollment);
  const canEnroll =
    (!hasEnrollment && (seatsLeft === null || seatsLeft > 0)) ||
    enrollmentStatus === "PENDING_PAYMENT";
  const primaryButtonLabel = useMemo(() => {
    if (!user) return "Đăng nhập để tham gia";
    if (enrollmentStatus === "PAID") return "Bạn đã thanh toán";
    if (enrollmentStatus === "PENDING_PAYMENT") return "Hoàn tất thanh toán";
    if (enrollmentStatus === "WAITLIST") return "Bạn đang trong danh sách chờ";
    if (hasEnrollment) return "Bạn đã đăng ký";
    if (seatsLeft !== null && seatsLeft <= 0) return "Đã hết chỗ";
    return "Thanh toán & tham gia";
  }, [user, enrollmentStatus, hasEnrollment, seatsLeft]);
  const showSessionBooking = Boolean(user) && enrollmentStatus === "PAID";

  // 👉 lọc buổi theo ngày
  const visibleSessions = !selectedDate
    ? sessions
    : sessions.filter((s) => {
        if (!s?.start_time) return false;
        const d = new Date(s.start_time);
        if (Number.isNaN(d.getTime())) return false;
        const dateStr = d.toISOString().slice(0, 10); // yyyy-mm-dd
        return dateStr === selectedDate;
      });

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/classes"
            className="group inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-x-0.5 hover:border-emerald-300 hover:text-emerald-600"
          >
            <span className="text-lg">←</span>
            Danh sách khóa học
          </Link>
          {seatsLeft !== null && (
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-600 shadow">
              <span className="text-xs uppercase tracking-[0.3em] text-blue-500">
                Còn lại
              </span>
              <span className="text-lg">{Math.max(seatsLeft, 0)}</span>
              <span className="text-xs text-slate-500">suất</span>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-xl">
              {clazz.image_url && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={clazz.image_url}
                    alt={clazz.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex flex-col gap-6 p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">
                      Smash Training Series
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                      {clazz.title || "Khóa học cầu lông"}
                    </h1>
                    {level && (
                      <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {typeof level === "object" ? level?.name : level}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={!canEnroll}
                    className={`rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition ${
                      canEnroll
                        ? "bg-gradient-to-r from-emerald-500 to-blue-600 hover:scale-[1.03]"
                        : "bg-slate-400 cursor-not-allowed"
                    }`}
                    title={!user ? "Hãy đăng nhập để thanh toán" : ""}
                  >
                    {primaryButtonLabel}
                  </button>
                </div>

                <p className="text-base leading-relaxed text-slate-600">
                  {clazz.description ||
                    "Khóa học cầu lông được thiết kế chuyên sâu với giáo án linh hoạt, giúp bạn bứt phá kỹ thuật và thể lực."}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {capacity !== null && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.2em] text-blue-500">
                        Sức chứa
                      </p>
                      <p className="mt-1 text-lg font-semibold text-blue-900">
                        {capacity} học viên
                        {seatsLeft !== null && (
                          <span className="text-sm font-normal text-blue-700">
                            {" "}- còn {Math.max(seatsLeft, 0)}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {priceDisplay && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">
                        Học phí
                      </p>
                      <p className="mt-1 text-lg font-semibold text-emerald-700">
                        {priceDisplay}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                    Lịch buổi học
                  </p>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Theo dõi thời gian tập luyện
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>Chọn ngày</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="rounded-xl border border-blue-100 px-3 py-1 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate("")}
                      className="rounded-xl border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                    >
                      Xoá lọc
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                {showSessionBooking && (
                  <p className="mb-3 text-xs font-medium text-emerald-600">
                    Bạn có thể đăng ký tối đa một buổi học cho mỗi ngày. Hãy chọn
                    lịch phù hợp với mình!
                  </p>
                )}
                <table className="w-full min-w-[320px] text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-left text-xs uppercase tracking-[0.2em] text-blue-500">
                      <th className="px-4 py-3">Bắt đầu</th>
                      <th className="px-4 py-3">Kết thúc</th>
                      {showSessionBooking && (
                        <th className="px-4 py-3 text-right">Đăng ký</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-blue-50 last:border-0 hover:bg-blue-50/40"
                      >
                        <td className="px-4 py-3 text-slate-600">
                          {session?.start_time
                            ? new Date(session.start_time).toLocaleString("vi-VN", {
                                hour12: false,
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {session?.end_time
                            ? new Date(session.end_time).toLocaleString("vi-VN", {
                                hour12: false,
                              })
                            : "—"}
                        </td>
                        {showSessionBooking && (
                          <td className="px-4 py-3 text-right">
                            {bookingMap?.[session.id] === "BOOKED" ? (
                              <span className="inline-flex items-center justify-center rounded-xl bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Đã đăng ký
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBookSession(session.id)}
                                disabled={bookingBusyId === session.id}
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {bookingBusyId === session.id
                                  ? "Đang đăng ký..."
                                  : "Đăng ký buổi này"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {!visibleSessions.length && (
                      <tr>
                        <td
                          className="px-4 py-4 text-center text-sm text-slate-400"
                          colSpan={showSessionBooking ? 3 : 2}
                        >
                          {selectedDate
                            ? "Không có buổi học nào trong ngày đã chọn"
                            : "Lịch học đang được cập nhật."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {showSessionBooking && bookingMessage && (
                  <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                    {bookingMessage}
                  </p>
                )}
                {showSessionBooking && bookingError && (
                  <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600">
                    {bookingError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-white to-blue-100/40 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800">Huấn luyện viên</h3>
              {clazz?.coach ? (
                <div className="mt-4 flex items-center gap-4">
                  {clazz.coach.photo_url ? (
                    <img
                      src={clazz.coach.photo_url}
                      alt={clazz.coach.name || "Coach"}
                      className="h-20 w-20 rounded-2xl object-cover shadow"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/70 text-xs font-semibold text-emerald-500">
                      Coach
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-800">
                      {clazz.coach.name}
                    </p>
                    {clazz.coach.email && (
                      <p className="text-sm text-slate-500">{clazz.coach.email}</p>
                    )}
                    {clazz.coach.phone && (
                      <p className="text-sm text-slate-500">☎ {clazz.coach.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Khóa học đang được cập nhật thông tin huấn luyện viên.
                </p>
              )}
            </div>

            {clazz?.location && (
              <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800">Địa điểm tập luyện</h3>
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{clazz.location.name}</span>
                  {clazz.location.address ? ` — ${clazz.location.address}` : ""}
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-inner">
              <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
                Gợi ý chuẩn bị
              </h4>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                <li>Đến trước giờ học 10 phút để khởi động kỹ.</li>
                <li>Trang phục thể thao thoải mái, mang theo nước uống.</li>
                <li>Chuẩn bị vợt riêng hoặc liên hệ HLV để được hỗ trợ.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
