import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

function formatCurrency(value) {
  if (typeof value === "number") {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });
  }
  return value ?? "";
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", { hour12: false });
}

export default function PaymentHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/api/enrollments/my");

        if (!res?.ok) {
          throw new Error(res?.message || "Không tải được dữ liệu lịch sử");
        }

        // Giống logic trong PaymentPage: hỗ trợ cả { data: { data: [] } } và { data: [] }
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        if (!cancelled) {
          setItems(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Không thể tải lịch sử thanh toán");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingList = useMemo(
    () => items.filter((item) => item.status === "PENDING_PAYMENT"),
    [items]
  );

  const paidList = useMemo(
    () => items.filter((item) => item.status === "PAID"),
    [items]
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-700 py-45 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.6em] text-emerald-200">
            Payment Overview
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-white">
            Lịch sử thanh toán
          </h1>
          <p className="mt-3 text-base text-white/90">
            Theo dõi các đơn đang chờ thanh toán và các khóa học bạn đã thanh
            toán thành công.
          </p>
        </div>

        <div className="space-y-8">
          {loading && (
            <div className="rounded-3xl bg-white/90 p-8 text-center shadow-xl ring-1 ring-blue-100">
              <p className="text-sm text-slate-600">
                Đang tải lịch sử thanh toán…
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl bg-rose-50/90 p-6 text-sm text-rose-700 shadow ring-1 ring-rose-100">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-3xl bg-white/90 p-8 text-center shadow-xl ring-1 ring-blue-100">
              <p className="text-sm text-slate-600">
                Bạn chưa có đăng ký nào để hiển thị.
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              {/* Đơn đang chờ thanh toán */}
              <div className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-amber-100/80">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Đang chờ thanh toán
                    </h2>
                    <p className="text-xs text-slate-500">
                      Các đăng ký ở trạng thái PENDING_PAYMENT.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                    {pendingList.length} đơn
                  </span>
                </div>

                {pendingList.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Không có đơn nào đang chờ thanh toán.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingList.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">
                            {item.class_title || "Khóa học"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Mã đăng ký: #{item.id} · Tạo lúc{" "}
                            {formatDateTime(item.created_at)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Học phí:{" "}
                            <span className="font-semibold text-emerald-700">
                              {formatCurrency(item.price)}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            PENDING_PAYMENT
                          </span>
                          <Link
                            to={`/payments/${item.id}`}
                            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md"
                          >
                            Tiếp tục thanh toán
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Đơn đã thanh toán */}
              <div className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-emerald-100/80">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Đã thanh toán
                    </h2>
                    <p className="text-xs text-slate-500">
                      Các đăng ký đã ở trạng thái PAID.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    {paidList.length} đơn
                  </span>
                </div>

                {paidList.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Bạn chưa có khóa học nào đã thanh toán.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paidList.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">
                            {item.class_title || "Khóa học"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Mã đăng ký: #{item.id} · Thanh toán lúc{" "}
                            {formatDateTime(item.created_at)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Học phí:{" "}
                            <span className="font-semibold text-emerald-700">
                              {formatCurrency(item.price)}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            PAID
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
