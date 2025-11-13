import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function MySchedule() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/me/schedule");
        if (res.ok) {
          setData(Array.isArray(res.data) ? res.data : []);
        } else {
          setError(res.message || "Không tải được lịch học");
          setData([]);
        }
      } catch (err) {
        setError(err?.message || "Không tải được lịch học");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-gray-500">
        Đang tải lịch học…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Lịch học của tôi</h1>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Thời gian</th>
              <th className="p-3 text-left">Lớp</th>
              <th className="p-3 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.session_id} className="border-t">
                <td className="p-3">
                  {r.start_time
                    ? new Date(r.start_time).toLocaleString("vi-VN", {
                        hour12: false,
                      })
                    : "—"}{" "}
                  –{" "}
                  {r.end_time
                    ? new Date(r.end_time).toLocaleString("vi-VN", {
                        hour12: false,
                      })
                    : "—"}
                </td>
                <td className="p-3">{r.class_title}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={3}>
                  Bạn chưa có buổi học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
