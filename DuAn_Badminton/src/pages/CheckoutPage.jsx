import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const METHODS = [
  { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
  { value: "CASH", label: "Thanh toán tiền mặt" },
  { value: "VNPAY", label: "Ví điện tử VNPAY (giả lập)" },
  { value: "MOMO", label: "Ví MOMO (giả lập)" },
];

function formatCurrency(value) {
  if (value == null) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  });
}

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification, fetchNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await api.post("/api/payments/create-checkout", {
          class_id: Number(id),
        });
        if (!active) return;
        if (res?.ok) {
          setCheckout(res.data);
          setMethod(res.data?.method || "BANK_TRANSFER");
        } else {
          setError(res?.message || "Không thể tạo phiên thanh toán");
        }
      } catch (err) {
        setError(err?.message || "Không thể tạo phiên thanh toán");
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [id]);

  const klass = checkout?.class || null;
  const amountDisplay = useMemo(
    () => formatCurrency(checkout?.amount ?? klass?.price),
    [checkout?.amount, klass?.price]
  );

  const handleConfirm = async (success = true) => {
    if (!checkout?.payment_id) return;
    setConfirming(true);
    setError("");
    try {
      const res = await api.post(`/api/payments/${checkout.payment_id}/confirm`, {
        success,
        method,
        note: note.trim() || null,
      });
      if (res?.ok) {
        addNotification({
          title: "Thanh toán",
          body: success
            ? "Bạn đã thanh toán thành công khóa học. Đừng quên chọn buổi học phù hợp trong lịch buổi học nhé!"
            : "Thanh toán thất bại. Hãy thử lại hoặc chọn phương thức khác.",
        });
        fetchNotifications();
        if (success) {
          navigate(`/classes/${id}`);
        }
      } else {
        setError(res?.message || "Không thể xác nhận thanh toán");
      }
    } catch (err) {
      setError(err?.message || "Không thể xác nhận thanh toán");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-emerald-900 py-14 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-emerald-200">
              Ready To Smash
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              Xác nhận thanh toán khóa học
            </h1>
          </div>
          <Link
            to={`/classes/${id}`}
            className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ← Quay lại chi tiết lớp
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="rounded-3xl bg-white/10 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            {loading ? (
              <p className="text-sm text-blue-100">Đang khởi tạo phiên thanh toán...</p>
            ) : !checkout ? (
              <p className="rounded-2xl bg-rose-50/20 px-4 py-3 text-sm text-rose-100">
                {error || "Không thể tải thông tin thanh toán. Vui lòng thử lại."}
              </p>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">
                    Khóa học
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {klass?.title || "Khóa học cầu lông"}
                  </h2>
                  <div className="mt-4 grid gap-3 text-sm text-blue-100 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
                        Huấn luyện viên
                      </p>
                      <p className="mt-1 font-medium text-white/90">
                        {klass?.coach?.name || "Đang cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
                        Địa điểm
                      </p>
                      <p className="mt-1 font-medium text-white/90">
                        {klass?.location?.name || "Đang cập nhật"}
                      </p>
                      {klass?.location?.address && (
                        <p className="text-xs text-blue-100/70">
                          {klass.location.address}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
                        Học phí
                      </p>
                      <p className="mt-1 text-lg font-semibold text-emerald-200">
                        {amountDisplay}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">
                    Phương thức thanh toán
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {METHODS.map((item) => (
                      <label
                        key={item.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                          method === item.value
                            ? "border-emerald-300 bg-emerald-400/20"
                            : "border-white/15 bg-white/5 hover:border-emerald-200/60"
                        }`}
                      >
                        <input
                          type="radio"
                          className="h-4 w-4 accent-emerald-400"
                          name="method"
                          value={item.value}
                          checked={method === item.value}
                          onChange={(event) => setMethod(event.target.value)}
                        />
                        <span className="text-white">{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <label className="mt-4 flex flex-col gap-2 text-sm text-blue-100">
                    Ghi chú (tuỳ chọn)
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                    />
                  </label>
                </div>

                {error && (
                  <p className="rounded-2xl bg-rose-50/20 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">
                    Play Bold · Pay Secure · Join Fast
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={() => handleConfirm(false)}
                      className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-60"
                    >
                      Thanh toán thất bại
                    </button>
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={() => handleConfirm(true)}
                      className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-xl shadow-emerald-900/40 transition hover:scale-[1.03] disabled:opacity-60"
                    >
                      {confirming ? "Đang xác nhận..." : "Xác nhận thanh toán"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-3xl bg-white/10 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">
              Hướng dẫn chuyển khoản
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-blue-100">
              <li>
                1. Chọn phương thức "Chuyển khoản ngân hàng" và chuyển tới:
                <br />
                <span className="font-semibold text-white">
                  0123 456 789 - CLB SmashBadminton - Ngân hàng ACB
                </span>
              </li>
              <li>
                2. Nội dung chuyển khoản: <b>{`BAD-${checkout?.enrollment_id || "???"}`}</b>
              </li>
              <li>3. Sau khi thanh toán, bấm "Xác nhận thanh toán" để hoàn tất.</li>
              <li>
                Nếu bạn chọn "Thanh toán tiền mặt", vui lòng đến sớm hơn 15 phút để hoàn thành thủ tục.
              </li>
            </ul>
            <div className="mt-6 rounded-2xl bg-white/15 px-4 py-3 text-sm text-white/90">
              <p className="font-semibold">Tổng thanh toán</p>
              <p className="text-2xl font-bold text-emerald-200">{amountDisplay}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
