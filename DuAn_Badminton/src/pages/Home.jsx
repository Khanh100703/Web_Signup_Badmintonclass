import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

const HERO_FALLBACKS = [
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1400&q=80",
];

const SCHEDULES = [
  {
    title: "Lớp cơ bản buổi tối",
    days: "Thứ 2 – Thứ 4 – Thứ 6",
    time: "18:00 – 20:00",
    location: "Sân Cầu Lông Quận 1",
  },
  {
    title: "Lớp nâng cao cuối tuần",
    days: "Thứ 7 – Chủ nhật",
    time: "08:00 – 11:00",
    location: "Nhà thi đấu Phú Thọ",
  },
  {
    title: "Lớp trẻ em",
    days: "Thứ 3 – Thứ 5",
    time: "16:30 – 18:00",
    location: "Sân Quận 7",
  },
];

const TUITION_PACKAGES = [
  {
    name: "Gói trải nghiệm",
    price: "1.200.000đ / tháng",
    includes: ["08 buổi / tháng", "Mượn vợt miễn phí", "Đánh giá trình độ cá nhân"],
  },
  {
    name: "Gói chuyên sâu",
    price: "1.800.000đ / tháng",
    popular: true,
    includes: [
      "12 buổi / tháng",
      "Huấn luyện viên kèm nhóm nhỏ",
      "Bài tập thể lực & chiến thuật",
    ],
  },
  {
    name: "Gói thi đấu",
    price: "2.500.000đ / tháng",
    includes: [
      "Coaching 1-1 hàng tuần",
      "Phân tích video kỹ thuật",
      "Hỗ trợ tham gia giải đấu",
    ],
  },
];

const DIFFERENTIATORS = [
  {
    title: "Giáo trình chuẩn quốc tế",
    desc: "Bám sát chuẩn BWF, cập nhật liên tục với xu hướng thi đấu hiện đại.",
  },
  {
    title: "Đội ngũ huấn luyện viên tận tâm",
    desc: "Huấn luyện viên có chứng chỉ, kinh nghiệm thi đấu và kỹ năng sư phạm.",
  },
  {
    title: "Lộ trình cá nhân hóa",
    desc: "Theo dõi tiến bộ từng tuần, điều chỉnh bài tập phù hợp thể lực & mục tiêu.",
  },
  {
    title: "Cộng đồng năng động",
    desc: "Tham gia sparring, mini game, workshop dinh dưỡng và chiến thuật.",
  },
];

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
  const heroImage = useMemo(() => {
    if (!featured.length) return HERO_FALLBACKS[0];
    const current = featured[slide] || featured[0];
    return (
      current?.image_url || HERO_FALLBACKS[slide % HERO_FALLBACKS.length]
    );
  }, [featured, slide]);

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

            {/* Ảnh hero */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border">
              <img
                src={heroImage}
                alt={featured[slide]?.title || "Khóa học cầu lông"}
                className="h-full w-full object-cover"
              />
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

          </div>
        </div>
      </section>

      {/* ===== GIỚI THIỆU ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold">Tại sao nên học cầu lông cùng chúng tôi?</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Trung tâm Badminton Class mang đến môi trường tập luyện chuyên nghiệp
              với trang thiết bị hiện đại, lịch học linh hoạt và đội ngũ huấn luyện
              viên tận tâm. Chúng tôi thiết kế lộ trình phù hợp cho từng độ tuổi,
              từ người mới bắt đầu đến vận động viên thi đấu.
            </p>
            <ul className="mt-6 space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                <span>Kiểm tra đầu vào miễn phí để xác định trình độ chính xác.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                <span>Giáo án cá nhân hóa, theo dõi tiến bộ qua từng buổi tập.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                <span>Cộng đồng học viên năng động với nhiều hoạt động ngoại khóa.</span>
              </li>
            </ul>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border p-5">
              <h3 className="text-lg font-semibold">Cam kết tiến bộ rõ rệt</h3>
              <p className="mt-2 text-sm text-gray-600">
                Sau 08 buổi, học viên nắm chắc kỹ thuật di chuyển, đánh thuận tay,
                trái tay và các bài phối hợp chiến thuật cơ bản.
              </p>
            </div>
            <div className="rounded-2xl border p-5">
              <h3 className="text-lg font-semibold">Hỗ trợ ngoài giờ</h3>
              <p className="mt-2 text-sm text-gray-600">
                Nhận giáo án luyện tập tại nhà, video hướng dẫn động tác và tư vấn
                dinh dưỡng giúp phục hồi sau mỗi buổi tập.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LỊCH HỌC ===== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-3xl font-bold">Lịch học linh hoạt</h2>
            <Link to="/classes" className="px-4 py-2 rounded-xl border text-sm">
              Xem tất cả lớp học
            </Link>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {SCHEDULES.map((item) => (
              <div key={item.title} className="rounded-2xl border bg-white p-6">
                <div className="text-sm uppercase tracking-wide text-gray-400">
                  {item.days}
                </div>
                <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-600">{item.time}</p>
                <p className="mt-2 text-sm text-gray-600">{item.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HỌC PHÍ ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">Chương trình &amp; học phí</h2>
          <p className="mt-4 text-center text-gray-600 max-w-3xl mx-auto">
            Chọn gói học phù hợp với mục tiêu của bạn. Mỗi gói đều bao gồm bảo hiểm
            chấn thương cơ bản và quyền tham gia các buổi sinh hoạt cộng đồng hàng
            tháng.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {TUITION_PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  pkg.popular ? "border-black" : ""
                }`}
              >
                {pkg.popular && (
                  <span className="inline-block px-3 py-1 text-xs rounded-full bg-black text-white">
                    Phổ biến
                  </span>
                )}
                <h3 className="mt-3 text-xl font-semibold">{pkg.name}</h3>
                <div className="mt-2 text-2xl font-bold">{pkg.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KHÁC BIỆT ===== */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">
            Điều gì làm chúng tôi trở nên khác biệt?
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-200">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Sẵn sàng vào sân?</h2>
          <p className="mt-4 text-gray-600">
            Để lại thông tin cho chúng tôi hoặc đăng ký ngay để giữ chỗ trong lớp phù
            hợp nhất. Đội ngũ tư vấn sẽ liên hệ trong vòng 24 giờ.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/classes" className="px-5 py-3 rounded-2xl bg-black text-white">
              Đăng ký lớp học
            </Link>
            <Link to="/contact" className="px-5 py-3 rounded-2xl border">
              Nhận tư vấn miễn phí
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
