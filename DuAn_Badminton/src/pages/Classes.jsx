import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Classes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/classes");
        setItems(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return <div className="max-w-6xl mx-auto px-4 py-10">Đang tải…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Danh sách khóa học</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => (
          <Link
            to={`/classes/${c.id}`}
            key={c.id}
            className="rounded-2xl border p-5 hover:shadow"
          >
            <div className="h-36 rounded-xl bg-gray-100 mb-3" />
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              Sức chứa: {c.class_capacity || "—"}
              className="rounded-2xl border bg-white overflow-hidden
              hover:shadow-lg hover:scale-[1.01] transition flex flex-col"
            </div>
            <div className="w-full h-56 bg-gray-100 overflow-hidden flex items-center justify-center">
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.title}
                  className="w-full h-full object-cover animate-fadeIn"
                  loading="lazy"
                />
              ) : (
                <div className="text-gray-400 text-sm">
                  Hình ảnh đang cập nhật
                </div>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="font-semibold text-lg">{c.title}</div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                {c.description ||
                  "Khóa học cầu lông phù hợp với nhiều trình độ khác nhau."}
              </p>
              <div className="mt-4 text-xs text-gray-500 flex flex-col gap-1">
                <span>
                  HLV: <b>{c.coach_name || "Đang cập nhật"}</b>
                </span>
                <span>
                  Địa điểm: <b>{c.location_name || "Sẽ thông báo"}</b>
                </span>
                <span>
                  Chỗ trống ước tính: <b>{c.remaining_estimate ?? "—"}</b>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
