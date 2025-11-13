import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Classes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // API_URL mặc định là http://localhost:5000 và ta gọi kèm /api
        const res = await api.get("/api/classes");
        // wrapper fetch -> res = { ok:true, data:[...] }
        const list = Array.isArray(res?.data) ? res.data : [];
        setItems(list);
        // debug: mở console để xem
        console.log("GET /api/classes ->", res);
      } catch (e) {
        console.error("Classes error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="min-h-[50vh] bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <p className="text-sm font-medium text-blue-600 animate-pulse">
          Đang tải danh sách khóa học...
        </p>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">
            Smash Lineup
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
            Khóa học nổi bật
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Chọn lớp phù hợp với trình độ và lịch trình của bạn để sẵn sàng bứt phá.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              to={`/classes/${c.id}`}
              key={c.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200"
            >
              <div className="flex h-44 items-center justify-center overflow-hidden bg-slate-100">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Hình ảnh đang cập nhật
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {c.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {c.description ||
                      "Giáo trình cầu lông được thiết kế cho mọi trình độ."}
                  </p>
                </div>

                <div className="grid gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
                    HLV: {c.coach_name || "Đang cập nhật"}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
                    Địa điểm: {c.location_name || "Sẽ thông báo"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                    Sức chứa: {c.capacity ?? "—"}
                    {typeof c.seats_remaining === "number" && (
                      <span className="text-xs text-slate-500">
                        {" "}- còn {c.seats_remaining}
                      </span>
                    )}
                  </span>
                  {typeof c.price !== "undefined" && (
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-600">
                      Học phí: {c.price}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
