import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function MySchedule() {
  const [data, setData] = useState([]);
  useEffect(() => {
    (async () => setData((await api.get("/api/me/schedule")).data || []))();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Lịch học của tôi</h1>
      <div className="overflow-x-auto rounded-2xl border">
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
                  {new Date(r.start_time).toLocaleString()} –{" "}
                  {new Date(r.end_time).toLocaleString()}
                </td>
                <td className="p-3">{r.class_title}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
