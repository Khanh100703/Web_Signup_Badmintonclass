import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const formatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function CoachClasses() {
  const [classes, setClasses] = useState([]);
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notifying, setNotifying] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/coaches/me/classes");
      setClasses(Array.isArray(res?.data) ? res.data : res?.data?.data || []);
      setCoach(res?.coach || null);
    } catch (e) {
      setError(e?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleNotify(sessionId) {
    setFeedback("");
    setNotifying(sessionId);
    try {
      const res = await api.post(`/api/sessions/${sessionId}/notify`);
      const msg = res?.message || res?.data?.message || "Đã gửi thông báo";
      setFeedback(msg);
    } catch (e) {
      setFeedback(e?.message || "Không gửi được email");
    } finally {
      setNotifying(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Lớp học của huấn luyện viên</h1>
          {coach ? (
            <p className="text-gray-600 mt-2">
              Xin chào <b>{coach.name}</b> – đây là danh sách lớp mà bạn phụ trách.
            </p>
          ) : (
            <p className="text-gray-600 mt-2">
              Không tìm thấy hồ sơ huấn luyện viên gắn với tài khoản này. Vui lòng
              liên hệ quản trị viên để được hỗ trợ.
            </p>
          )}
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border text-sm hover:shadow"
        >
          Tải lại
        </button>
      </div>

      {feedback && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-blue-50 text-blue-700">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="mt-10 text-gray-500">Đang tải dữ liệu…</div>
      ) : error ? (
        <div className="mt-10 text-red-600">{error}</div>
      ) : !classes.length ? (
        <div className="mt-10 text-gray-600">
          Hiện chưa có lớp học nào được gán cho bạn.
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          {classes.map((clazz) => (
            <div
              key={clazz.id}
              className="rounded-2xl border overflow-hidden shadow-sm"
            >
              <div className="grid md:grid-cols-[320px,1fr]">
                <div className="relative bg-gray-100 aspect-[4/3] md:aspect-auto">
                  {clazz.image_url ? (
                    <img
                      src={clazz.image_url}
                      alt={clazz.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">
                      Chưa có hình ảnh
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">{clazz.title}</h2>
                      {clazz.level_name && (
                        <span className="mt-2 inline-block text-xs px-2 py-1 rounded-full bg-gray-100">
                          {clazz.level_name}
                        </span>
                      )}
                    </div>
                    {clazz.remaining_estimate != null && (
                      <span className="text-sm text-gray-500">
                        Ước tính còn {clazz.remaining_estimate} chỗ trống
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-gray-600 whitespace-pre-line">
                    {clazz.description || "Chưa có mô tả chi tiết."}
                  </p>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Các buổi học sắp tới</h3>
                    {clazz.sessions?.length ? (
                      <div className="space-y-3">
                        {clazz.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                          >
                            <div>
                              <div className="font-medium">
                                {session.start_time
                                  ? formatter.format(new Date(session.start_time))
                                  : "Chưa cập nhật"}
                              </div>
                              {session.end_time && (
                                <div className="text-sm text-gray-500">
                                  Kết thúc: {formatter.format(new Date(session.end_time))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleNotify(session.id)}
                              disabled={notifying === session.id}
                              className="px-4 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-50"
                            >
                              {notifying === session.id
                                ? "Đang gửi..."
                                : "Gửi email nhắc lịch"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Chưa có buổi học nào cho lớp này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
