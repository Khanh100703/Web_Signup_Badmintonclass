import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", { hour12: false });
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
      alert(err?.message || "Không gửi được thông báo");
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
        <div className="rounded-2xl border px-4 py-2 bg-white">
          <div className="text-xs text-gray-500">Tổng số lớp</div>
          <div className="text-xl font-semibold">{classCount}</div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {data.map((clazz) => (
          <div
            key={clazz.id}
            className="rounded-2xl border bg-white overflow-hidden"
          >
            <div className="grid md:grid-cols-[2fr,3fr] gap-0">
              <div className="p-6 border-b md:border-b-0 md:border-r">
                <h2 className="text-xl font-semibold">{clazz.title}</h2>
                <p className="mt-2 text-sm text-gray-600">
                  {clazz.description || "Chưa có mô tả cho lớp này."}
                </p>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-semibold">Địa điểm:</span>{" "}
                    {clazz.location_name || "Đang cập nhật"}
                  </div>
                  <div>
                    <span className="font-semibold">Trình độ:</span>{" "}
                    {clazz.level_name || "Mọi trình độ"}
                  </div>
                  <div>
                    <span className="font-semibold">Sức chứa:</span>{" "}
                    {clazz.class_capacity || "—"} học viên
                  </div>
                  <div>
                    <span className="font-semibold">Ước tính còn:</span>{" "}
                    {clazz.remaining_estimate ?? "—"} chỗ
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Các buổi học
                  </h3>
                </div>
                <div className="rounded-2xl border overflow-hidden">
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
                          <td className="p-3">
                            {formatDateTime(session.start_time)}
                          </td>
                          <td className="p-3">
                            {formatDateTime(session.end_time)}
                          </td>
                          <td className="p-3">
                            {session.capacity ?? clazz.class_capacity ?? "—"}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => sendReminder(session.id)}
                              className="px-3 py-2 rounded-xl border hover:shadow hover:scale-[1.02] transition"
                              disabled={sendingSession === session.id}
                            >
                              {sendingSession === session.id
                                ? "Đang gửi…"
                                : "Gửi thông báo"}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!clazz.sessions?.length && (
                        <tr>
                          <td
                            className="p-3 text-gray-500 text-center"
                            colSpan={4}
                          >
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
        {!data.length && (
          <div className="rounded-2xl border p-6 text-center text-gray-500 bg-white">
            Bạn chưa được phân công lớp nào.
          </div>
        )}
      </div>
    </div>
  );
}
