import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

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

const BANK_QR_URL = "/images/payment/MyQR.jpg"; // đổi đúng tên file QR của bạn
const BANK_NAME = "TP Bank";
const BANK_OWNER = "DANG XUAN KHANH";
const BANK_NUMBER = "07338072501";

export default function PaymentPage() {
  const { enrollmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollment, setEnrollment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEnrollment() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/api/enrollments/my`);
        if (!res?.ok) {
          throw new Error(res?.message || "Không tải được danh sách đăng ký");
        }

        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        const found = list.find(
          (item) => Number(item.id) === Number(enrollmentId)
        );

        if (!found) {
          throw new Error("Không tìm thấy đăng ký phù hợp");
        }

        if (!cancelled) {
          setEnrollment(found);
        }
      } catch (err) {
        if (!cancelled) {
          setEnrollment(null);
          setError(err?.message || "Không thể tải thông tin thanh toán");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (user) {
      loadEnrollment();
    } else {
      setLoading(false);
      setEnrollment(null);
    }

    return () => {
      cancelled = true;
    };
  }, [enrollmentId, user]);

  const classLink = useMemo(() => {
    if (!enrollment?.class_id) return "/classes";
    return `/classes/${enrollment.class_id}`;
  }, [enrollment]);

  async function handleConfirmPayment() {
    if (!enrollment || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await api.post(
        `/api/enrollments/${enrollment.id}/confirm-payment`
      );
      if (!res?.ok) {
        throw new Error(res?.message || "Thanh toán thất bại");
      }

      const updated =
        res?.data && typeof res.data === "object"
          ? res.data
          : res?.data?.data ?? null;

      if (updated) {
        setEnrollment((prev) => ({
          ...prev,
          ...updated,
        }));
      }

      setSuccessMessage(res?.message || "Thanh toán thành công");
    } catch (err) {
      setError(err?.message || "Không thể xác nhận thanh toán");
    } finally {
      setSubmitting(false);
    }
  }

  const isPaid = enrollment?.status === "PAID";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-lg">
          Đang tải thông tin thanh toán…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600 shadow-lg">
          {error}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600">
          <Link to="/classes" className="hover:underline">
            Khóa học
          </Link>
          <span>/</span>
          <Link to={classLink} className="font-medium hover:underline">
            Chi tiết lớp
          </Link>
          <span>/ Thanh toán</span>
        </div>
        {/* QR chuyển khoản ngân hàng */}
        <div className="mt-8 grid gap-6 md:grid-cols-[1.5fr,1fr] items-center">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Thông tin chuyển khoản
            </p>
            <p className="mt-2">
              <span className="font-semibold">Ngân hàng:</span> {BANK_NAME}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Chủ tài khoản:</span> {BANK_OWNER}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Số tài khoản:</span> {BANK_NUMBER}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              * Nội dung chuyển khoản nên ghi:{" "}
              <span className="font-mono font-semibold text-slate-700">
                {user?.name || "TenHocVien"} - {enrollment.class_title}
              </span>{" "}
              để dễ kiểm tra.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <img
                src={BANK_QR_URL}
                alt="QR thanh toán ngân hàng"
                className="h-56 w-56 object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 text-center">
              Quét mã QR bằng app ngân hàng để thanh toán nhanh. <br />
              Sau khi chuyển khoản xong, bấm nút{" "}
              <span className="font-semibold">"Thanh toán thành công"</span> ở
              bên dưới.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-slate-900">
            Thanh toán khóa học
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng kiểm tra lại thông tin trước khi xác nhận thanh toán.
          </p>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Khóa học</span>
              <span className="font-semibold text-slate-800">
                {enrollment.class_title || "Khóa học cầu lông"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái</span>
              <span
                className={`font-semibold ${
                  isPaid ? "text-emerald-600" : "text-orange-500"
                }`}
              >
                {isPaid ? "Đã thanh toán" : "Chờ thanh toán"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Học phí</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(enrollment.price)}
              </span>
            </div>
            {enrollment.note && (
              <div className="rounded-2xl bg-blue-50/70 p-4 text-slate-600">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-500">
                  Ghi chú
                </p>
                <p className="mt-1 text-sm">{enrollment.note}</p>
              </div>
            )}
          </div>

          {successMessage && (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}
          {error && !successMessage && (
            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={handleConfirmPayment}
              disabled={isPaid || submitting}
              className={`rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition ${
                isPaid || submitting
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-gradient-to-r from-emerald-500 to-blue-600 hover:scale-[1.03]"
              }`}
            >
              {isPaid
                ? "Đã thanh toán"
                : submitting
                ? "Đang xử lý…"
                : "Thanh toán thành công"}
            </button>
            <Link
              to={classLink}
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
            >
              Về trang lớp học
            </Link>
            {isPaid && (
              <button
                onClick={() => navigate("/me/schedule")}
                className="inline-flex items-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                Xem lịch học của tôi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
