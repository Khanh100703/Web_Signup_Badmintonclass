import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1602111942246-6f7c20a59f97?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80",
];

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
        {items.map((c, idx) => (
          <Link
            to={`/classes/${c.id}`}
            key={c.id}
            className="rounded-2xl border p-5 hover:shadow"
          >
            <div className="h-40 rounded-xl bg-gray-100 mb-3 overflow-hidden">
              <img
                src={c.image_url || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                alt={c.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              Sức chứa: {c.class_capacity || "—"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
