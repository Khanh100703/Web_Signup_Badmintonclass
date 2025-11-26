import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [clazz, setClazz] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentEnrollment, setCurrentEnrollment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 👉 thêm state chọn ngày
  const [selectedDate, setSelectedDate] = useState("");

  const isCoach = user?.role === "COACH";

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
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setErr("");

      try {
        const res1 = await api.get(`/api/classes/${id}`);
        const classPayload =
          res1?.data?.data && typeof res1.data.data === "object"
            ? res1.data.data
            : res1?.data ?? null;
        if (!classPayload) {
          throw new Error("Không tìm thấy lớp học");
        }

        if (!cancelled) {
          setClazz(classPayload);
          setSessions(
            Array.isArray(classPayload.sessions) ? classPayload.sessions : []
          );
        }

        if (user) {
          try {
            const resEnroll = await api.get(`/api/enrollments/my`);
            const list = Array.isArray(resEnroll?.data?.data)
              ? resEnroll.data.data
              : Array.isArray(resEnroll?.data)
              ? resEnroll.data
              : [];
            const found = list.find((e) => Number(e.class_id) === Number(id));
            if (!cancelled) {
              setCurrentEnrollment(found ?? null);
            }
          } catch (error) {
            console.error(error);
            if (!cancelled) setCurrentEnrollment(null);
          }
        } else if (!cancelled) {
          setCurrentEnrollment(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Không tải được chi tiết lớp");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const seatsLeft = useMemo(() => {
    if (clazz && typeof clazz.remaining_estimate === "number") {
      return clazz.remaining_estimate;
    }
    if (clazz && typeof clazz.seats_remaining === "number") {
      return clazz.seats_remaining;
    }
    return null;
  }, [clazz]);

  const handleRequireLogin = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  const goToPayment = (enrollmentId) => {
    navigate(`/payments/${enrollmentId}`);
  };

  async function handleCreateEnrollment() {
    if (submitting) return;
    if (isCoach) {
      alert("Huấn luyện viên không thể đăng ký khóa học.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/api/enrollments`, {
        class_id: Number(id),
      });

      if (!res?.ok) {
        throw new Error(res?.message || "Đăng ký thất bại");
      }

      const enrollmentData =
        res?.data && typeof res.data === "object"
          ? res.data
          : res?.data?.data ?? null;

      if (!enrollmentData?.id) {
        throw new Error("Không nhận được thông tin đăng ký");
      }

      setCurrentEnrollment(enrollmentData);
      alert(res?.message || "Đăng ký thành công, vui lòng thanh toán");
      goToPayment(enrollmentData.id);
    } catch (error) {
      alert(error?.message || "Không thể đăng ký lớp học");
    } finally {
      setSubmitting(false);
    }
  }

  const actionConfig = (() => {
    if (!user) {
      return {
        label: "Đăng ký",
        disabled: false,
        onClick: handleRequireLogin,
      };
    }

    if (isCoach) {
      return {
        label: "Huấn luyện viên không thể đăng ký",
        disabled: true,
        onClick: null,
      };
    }

    if (currentEnrollment?.status === "PAID") {
      return { label: "Đã tham gia", disabled: true, onClick: null };
    }

    if (currentEnrollment?.status === "PENDING_PAYMENT") {
      return {
        label: "Tiếp tục thanh toán",
        disabled: false,
        onClick: () => goToPayment(currentEnrollment.id),
      };
    }

    if (currentEnrollment?.status === "WAITLIST") {
      return {
        label: "Đang chờ xếp lớp",
        disabled: true,
        onClick: null,
      };
    }

    if (seatsLeft !== null && seatsLeft <= 0) {
      return { label: "Đã hết chỗ", disabled: true, onClick: null };
    }

    const label = currentEnrollment ? "Đăng ký lại" : "Đăng ký";
    return {
      label: submitting ? "Đang xử lý..." : label,
      disabled: submitting,
      onClick: handleCreateEnrollment,
    };
  })();

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
                    onClick={actionConfig.onClick || (() => {})}
                    disabled={actionConfig.disabled || !actionConfig.onClick}
                    className={`rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition ${
                      !actionConfig.disabled && actionConfig.onClick
                        ? "bg-gradient-to-r from-emerald-500 to-blue-600 hover:scale-[1.03]"
                        : "bg-slate-400 cursor-not-allowed"
                    }`}
                    title={
                      !user
                        ? "Hãy đăng nhập để thanh toán"
                        : actionConfig.disabled
                        ? actionConfig.label
                        : ""
                    }
                  >
                    {actionConfig.label}
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
                            {" "}
                            - còn {Math.max(seatsLeft, 0)}
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
                <table className="w-full min-w-[320px] text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-left text-xs uppercase tracking-[0.2em] text-blue-500">
                      <th className="px-4 py-3">Bắt đầu</th>
                      <th className="px-4 py-3">Kết thúc</th>
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
                            ? new Date(session.start_time).toLocaleString(
                                "vi-VN",
                                {
                                  hour12: false,
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {session?.end_time
                            ? new Date(session.end_time).toLocaleString(
                                "vi-VN",
                                {
                                  hour12: false,
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    {!visibleSessions.length && (
                      <tr>
                        <td
                          className="px-4 py-4 text-center text-sm text-slate-400"
                          colSpan={2}
                        >
                          {selectedDate
                            ? "Không có buổi học nào trong ngày đã chọn"
                            : "Lịch học đang được cập nhật."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-white to-blue-100/40 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800">
                Huấn luyện viên
              </h3>
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
                      <p className="text-sm text-slate-500">
                        {clazz.coach.email}
                      </p>
                    )}
                    {clazz.coach.phone && (
                      <p className="text-sm text-slate-500">
                        ☎ {clazz.coach.phone}
                      </p>
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
                <h3 className="text-lg font-semibold text-slate-800">
                  Địa điểm tập luyện
                </h3>
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {clazz.location.name}
                  </span>
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
