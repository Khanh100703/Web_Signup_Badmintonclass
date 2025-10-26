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
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
