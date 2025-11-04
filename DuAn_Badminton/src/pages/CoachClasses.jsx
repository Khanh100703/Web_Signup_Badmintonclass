import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      hour12: false,
    });
  } catch {
    return value;
  }
}

export default function CoachClasses() {
  const [data, setData] = useState([]);
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingSession, setSendingSession] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/coaches/me/classes");
        if (res?.ok) {
          setData(res.data || []);
          setCoach(res.coach || null);
        } else {
          setError(res?.message || "Không tải được dữ liệu lớp học");
        }
      } catch (err) {
        setError(err?.message || "Không tải được dữ liệu lớp học");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const classCount = useMemo(() => data.length, [data]);

  async function sendReminder(sessionId) {
    setSendingSession(sessionId);
    try {
      const res = await api.post(`/api/sessions/${sessionId}/notify`);
      if (res?.ok) {
        alert(
          res.sent
            ? `Đã gửi thông báo tới ${res.sent} học viên.`
            : "Không có học viên nào đang đăng ký buổi học này."
        );
      } else {
        alert(res?.message || "Gửi thông báo thất bại");
      }
    } catch (err) {
      alert(err?.message || "Không gửi được email thông báo");
    } finally {
      setSendingSession(null);
    }
  }

  if (loading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        Đang tải thông tin lớp học…
      </div>
    );

  if (error)
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lớp học do bạn phụ trách</h1>
          <p className="mt-2 text-gray-600">
            {coach?.name
              ? `Xin chào ${coach.name}! Dưới đây là danh sách lớp và các buổi học đang giao cho bạn.`
              : "Danh sách lớp học mà bạn đang phụ trách."}
          </p>
        </div>
        <div className="rounded-2xl border px-6 py-3 text-sm">
          Tổng cộng <b>{classCount}</b> lớp học
        </div>
      </div>

      {!data.length && (
        <div className="mt-12 rounded-2xl border p-8 text-center text-gray-500">
          Hiện tại bạn chưa được phân công lớp học nào.
        </div>
      )}

      <div className="mt-10 space-y-8">
        {data.map((clazz) => (
          <div key={clazz.id} className="rounded-2xl border bg-white shadow-sm">
            <div className="grid md:grid-cols-5 gap-6 p-6">
              <div className="md:col-span-2">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  {clazz.image_url ? (
                    <img
                      src={clazz.image_url}
                      alt={clazz.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
                      Hình ảnh đang cập nhật
                    </div>
                  )}
                </div>
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-700">Địa điểm:</span>{" "}
                    {clazz.location_name || "Đang cập nhật"}
                  </div>
                  {clazz.level_name && (
                    <div>
                      <span className="font-semibold text-gray-700">Trình độ:</span>{" "}
                      {clazz.level_name}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Sức chứa:</span>{" "}
                    {clazz.class_capacity || "—"}
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{clazz.title}</h2>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {clazz.description || "Khóa học cầu lông đang chờ bạn cập nhật mô tả chi tiết."}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                    {clazz.remaining_estimate ?? "—"} chỗ trống ước tính
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Bắt đầu</th>
                        <th className="text-left p-3">Kết thúc</th>
                        <th className="text-left p-3">Sức chứa</th>
                        <th className="text-left p-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(clazz.sessions || []).map((session) => (
                        <tr key={session.id} className="border-t">
                          <td className="p-3">{formatDateTime(session.start_time)}</td>
                          <td className="p-3">{formatDateTime(session.end_time)}</td>
                          <td className="p-3">{session.capacity ?? clazz.class_capacity ?? "—"}</td>
                          <td className="p-3">
                            <button
                              onClick={() => sendReminder(session.id)}
                              className="px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60"
                              disabled={sendingSession === session.id}
                            >
                              {sendingSession === session.id ? "Đang gửi…" : "Gửi email nhắc"}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!clazz.sessions?.length && (
                        <tr>
                          <td className="p-3 text-gray-500" colSpan={4}>
                            Chưa có buổi học nào được tạo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
