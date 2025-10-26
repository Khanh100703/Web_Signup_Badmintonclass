import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import Footer from "../components/Footer.jsx";

function useAutoSlide(length, delay = 6000) {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!length) return;
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1) % length);
    }, delay);
    return () => clearInterval(timer.current);
  }, [length, delay]);

  return [idx, setIdx];
}

export default function Home() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/classes");
        const arr = res?.data || res || [];
        setClasses(Array.isArray(arr) ? arr : []);
      } catch {
        setErr("Không tải được danh sách khóa học");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 👉 Nếu đang tải dữ liệu thì hiển thị thông báo nhẹ nhàng
  // 👉 Hooks PHẢI đặt trước mọi return sớm
  const featured = useMemo(() => (classes || []).slice(0, 3), [classes]);
  const [slide, setSlide] = useAutoSlide(featured.length, 6000);

  // ⬇️ Các return sớm dùng SAU khi đã gọi hooks
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <p className="text-gray-500 text-lg animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <p className="text-red-600 mb-3">{err}</p>
        <button
          className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-100"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <div>
      {/* ===== HERO / BANNER (tối đa 3 khóa học) ===== */}
      <section className="bg-gradient-to-br from-blue-50 to-white border-b">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-16 md:pt-14 md:pb-20">
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            {/* Nội dung trái */}
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
                {featured[slide]?.title || "Lớp học cầu lông cho mọi trình độ"}
              </h1>
              <p className="mt-4 text-gray-600">
                {featured[slide]?.description ||
                  "Giáo trình theo chuẩn BWF, HLV giàu kinh nghiệm, lịch học linh hoạt."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                {(featured[slide]?.class_capacity ??
                  featured[slide]?.max_capacity) != null && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border">
                    <span className="opacity-60">Sức chứa:</span>
                    <b>
                      {featured[slide]?.class_capacity ??
                        featured[slide]?.max_capacity}
                    </b>
                    <span className="opacity-60">học viên</span>
                  </span>
                )}
                {(featured[slide]?.price ?? featured[slide]?.tuition) && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border">
                    <span className="opacity-60">Học phí:</span>
                    <b>{featured[slide]?.price ?? featured[slide]?.tuition}</b>
                  </span>
                )}
              </div>

              <div className="mt-6 flex gap-4">
                <Link
                  to={`/classes/${featured[slide]?.id ?? ""}`}
                  className="px-5 py-3 rounded-2xl bg-black text-white disabled:opacity-50"
                  onClick={(e) => !featured[slide]?.id && e.preventDefault()}
                >
                  Đăng ký ngay
                </Link>
                <Link to="/contact" className="px-5 py-3 rounded-2xl border">
                  Liên hệ tư vấn
                </Link>
              </div>
            </div>

            {/* Ảnh/placeholder phải */}
            <div className="relative aspect-video rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-50 border overflow-hidden">
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-gray-400">Hình ảnh khóa học</div>
              </div>
            </div>

            {/* Chấm điều hướng DƯỚI banner */}
            <div className="col-span-full mt-6 flex items-center justify-center gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 w-7 rounded-full transition ${
                    i === slide ? "bg-black" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Chú thích lỗi nhỏ */}
            {err && (
              <div className="col-span-full mt-3 text-sm text-red-600 text-center">
                {err} — vui lòng thử lại sau.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
