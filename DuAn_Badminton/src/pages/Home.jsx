import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

/** Dữ liệu 3 banner */
const heroSlides = [
  {
    key: "classes",
    label: "Khóa học đa dạng",
    title: "Khóa học cầu lông cho mọi trình độ",
    description:
      "Từ người mới bắt đầu đến nâng cao, nhiều khung giờ linh hoạt phù hợp với sinh viên và người đi làm.",
    buttonText: "Đăng ký khóa học ngay",
    to: "/classes",
    bg: "/images/banner-classes.jpg", // 👉 đổi đường dẫn ảnh của bạn
  },
  {
    key: "coaches",
    label: "Huấn luyện viên chuyên môn cao",
    title: "Được kèm sát bởi HLV giàu kinh nghiệm",
    description:
      "Đội ngũ huấn luyện viên từng thi đấu và huấn luyện tại các CLB lớn, luôn theo sát kỹ thuật từng học viên.",
    buttonText: "Xem đội ngũ huấn luyện viên",
    to: "/coaches",
    bg: "/images/banner-coaches.jpg", // 👉 đổi đường dẫn ảnh của bạn
  },
  {
    key: "contact",
    label: "Liên hệ với chúng tôi",
    title: "Cần tư vấn lộ trình & lịch học?",
    description:
      "Liên hệ ngay để được tư vấn miễn phí về lịch học, học phí và chọn lớp phù hợp với mục tiêu của bạn.",
    buttonText: "Liên hệ ngay",
    to: "/contact",
    bg: "/images/banner-contact.jpg", // 👉 đổi đường dẫn ảnh của bạn
  },
];

const schedulePreview = [
  {
    level: "Thiếu nhi",
    times: "Cuối tuần | 8:00 - 11:00",
    location: "Sân Cầu Lông TADA D2",
    tuition: "800.000đ/tháng",
  },
  {
    level: "Cơ bản",
    times: "Thứ 2 - 4 - 6 | 16:00 - 18:00",
    location: "Sân Cầu Lông TADA D2",
    tuition: "1.500.000đ/tháng",
  },
  {
    level: "Trung bình",
    times: "Thứ 3 - 5 - 7 | 19:00 - 21:00",
    location: "Sân cầu lông Kỳ Hòa",
    tuition: "1.900.000đ/tháng",
  },
  {
    level: "Nâng cao",
    times: "Thứ 2 - 4 - 6 | 18:00 - 20:00",
    location: "Sân Cầu Lông TADA D2",
    tuition: "2.200.000đ/tháng",
  },
  {
    level: "Thi đấu",
    times: "Cuối tuần | 8:00 - 11:00",
    location: "Sân VHU Gym",
    tuition: "2.000.000đ/tháng",
  },
];

const highlightPoints = [
  {
    title: "Huấn luyện viên giàu kinh nghiệm",
    description:
      "Đội ngũ HLV đạt chuẩn quốc gia, từng thi đấu và huấn luyện tại các CLB lớn, luôn kèm sát từng học viên.",
  },
  {
    title: "Giáo trình cá nhân hoá",
    description:
      "Lộ trình luyện tập được thiết kế phù hợp với thể lực và mục tiêu của từng học viên, theo dõi tiến độ hàng tuần.",
  },
  {
    title: "Hệ thống sân tập chất lượng",
    description:
      "Cơ sở vật chất hiện đại, sân gỗ tiêu chuẩn thi đấu với ánh sáng tốt và trang thiết bị hỗ trợ đầy đủ.",
  },
  {
    title: "Cộng đồng năng động",
    description:
      "Cơ hội giao lưu với hơn 300 học viên ở mọi trình độ, tham gia giải đấu nội bộ và sự kiện ngoại khóa định kỳ.",
  },
];

// eslint-disable-next-line no-unused-vars
const fmtDT = (v) =>
  v ? new Date(v).toLocaleString("vi-VN", { hour12: false }) : "—";

export default function Home() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [err, setErr] = useState("");

  // index banner đang hiển thị
  const [heroIndex, setHeroIndex] = useState(0);

  // auto slide mỗi 7 giây
  useEffect(() => {
    if (!heroSlides.length) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [classesRes, coachesRes, locationsRes] = await Promise.all([
          api.get("/api/classes"),
          api.get("/api/coaches"),
          api.get("/api/locations"),
        ]);

        const classesArr = classesRes?.data || classesRes || [];
        const coachesArr = coachesRes?.data || coachesRes || [];
        const locationsArr = locationsRes?.data || locationsRes || [];

        setClasses(Array.isArray(classesArr) ? classesArr : []);
        setCoaches(Array.isArray(coachesArr) ? coachesArr : []);
        setLocations(Array.isArray(locationsArr) ? locationsArr : []);
      } catch {
        setErr("Không tải được danh sách khóa học");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const popularClasses = useMemo(() => (classes || []).slice(0, 6), [classes]);

  const coachCount = coaches.length;
  const locationCount = locations.length;

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

  const currentSlide = heroSlides[heroIndex];

  const goPrev = () =>
    setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);
  const goNext = () => setHeroIndex((i) => (i + 1) % heroSlides.length);

  return (
    <div>
      {/* ===== BANNER SLIDER 3 SLIDE ===== */}
      <section className="relative min-h-[340px] md:min-h-[420px] overflow-hidden">
        {/* Background của slide hiện tại */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('/images/Banner/banner.webp')`,
          }}
        />
        {/* Lớp phủ làm mờ + tối nền */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-emerald-800/70 backdrop-blur-sm" />

        {/* Nội dung slide */}
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row md:items-center gap-10">
          <div className="flex-1 text-white">
            <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-emerald-200">
              {currentSlide.label}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              {currentSlide.title}
            </h1>
            <p className="mt-4 text-sm md:text-base text-blue-100/90 max-w-xl">
              {currentSlide.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {["SMASH", "TRAIN", "COMPETE"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/15 px-4 py-1 text-xs font-semibold tracking-[0.4em] text-emerald-100"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8">
              <Link
                to={currentSlide.to}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:scale-[1.04]"
              >
                {currentSlide.buttonText}
              </Link>
            </div>
          </div>

          {/* Nút mũi tên + dot indicator */}
          <div className="flex flex-col items-center gap-4 md:items-end">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white transition hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white transition hover:bg-white/20"
              >
                ›
              </button>
            </div>
            <div className="flex gap-1">
              {heroSlides.map((s, idx) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setHeroIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === heroIndex
                      ? "w-6 bg-white"
                      : "w-2.5 bg-white/60 hover:bg-white/90"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== GIỚI THIỆU TRUNG TÂM ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto grid items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">
              Về SmashBadminton
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Trung tâm huấn luyện cầu lông năng động hàng đầu
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              SmashBadminton mang đến môi trường tập luyện chuyên nghiệp với
              giáo trình cá nhân hóa cho mọi trình độ. Đội ngũ huấn luyện viên
              giàu kinh nghiệm luôn theo sát học viên để tối ưu hóa kỹ thuật và
              thể lực.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  Cam kết cải thiện kỹ thuật rõ rệt chỉ sau 4 buổi tập.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  Lịch học linh hoạt, đáp ứng nhu cầu học viên bận rộn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  Trang thiết bị đạt chuẩn thi đấu và khu vực gym hỗ trợ thể
                  lực.
                </span>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Khóa học đang mở",
                value: classes.length,
              },
              {
                label: "Huấn luyện viên",
                value: coachCount,
              },
              {
                label: "Sân tập",
                value: locationCount,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-6 text-center shadow-sm"
              >
                <div className="text-3xl font-semibold text-emerald-600">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LỊCH HỌC & HỌC PHÍ ===== */}
      <section className="py-16 bg-gradient-to-br from-blue-900 via-slate-900 to-emerald-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">
                Lịch học & Học phí
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Lộ trình linh hoạt, phí ưu đãi
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-blue-100">
                Chọn khung giờ phù hợp với lịch trình cá nhân. Học viên mới được
                tư vấn lộ trình chi tiết và trải nghiệm buổi học thử hoàn toàn
                miễn phí.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/20">
            <table className="min-w-full border-collapse">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-b border-white/20">
                    Trình độ
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-b border-white/20">
                    Thời gian
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-b border-white/20">
                    Địa điểm
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-b border-white/20">
                    Học phí
                  </th>
                </tr>
              </thead>

              <tbody>
                {schedulePreview.map((row) => (
                  <tr
                    key={row.level}
                    className="hover:bg-white/5 border-b border-white/10 last:border-0"
                  >
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-white font-semibold">
                      {row.level}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-blue-100">
                      {row.times}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-blue-100">
                      {row.location}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-emerald-200 font-semibold">
                      {row.tuition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-blue-100/80">
            * Học phí đã bao gồm sân bãi, dụng cụ cơ bản và nước uống. Giảm thêm
            10% cho nhóm đăng ký từ 3 học viên trở lên.
          </p>
        </div>
      </section>

      {/* ===== ĐIỂM KHÁC BIỆT ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Điểm khác biệt của SmashBadminton
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {highlightPoints.map((item, index) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-6 shadow-sm"
              >
                <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10" />
                <span className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-blue-400/10" />
                <div className="relative">
                  <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KHÓA HỌC NỔI BẬT ===== */}
      <section className="py-16 bg-gradient-to-br from-white via-blue-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">
                Featured Classes
              </p>
              <h2 className="text-3xl font-bold text-slate-900">
                Khóa học nổi bật
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Từ kỹ thuật cơ bản đến chiến thuật thi đấu nâng cao, chọn ngay
                lớp học phù hợp để nâng cấp phong độ của bạn.
              </p>
            </div>

            <Link
              to="/classes"
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
            >
              Xem tất cả
            </Link>
          </div>

          {/* ⭐ Chỉ hiển thị 3 khóa học */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popularClasses.slice(2, 6).map((item) => (
              <Link
                key={item.id}
                to={`/classes/${item.id}`}
                className="flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Hình ảnh đang cập nhật
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-600">
                    {item.description ||
                      "Khóa học cầu lông phù hợp cho mọi trình độ."}
                  </p>

                  <div className="mt-auto text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                    {item.location_name || "Địa điểm linh hoạt"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA CUỐI TRANG ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl rounded-[40px] bg-gradient-to-br from-emerald-500 via-blue-600 to-slate-900 px-8 py-14 text-center text-white shadow-2xl">
          <p className="text-xs uppercase tracking-[0.5em] text-emerald-200">
            Join The Squad
          </p>
          <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
            Sẵn sàng bứt phá cùng SmashBadminton?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100">
            Đăng ký ngay để nhận tư vấn lộ trình miễn phí và tham gia buổi học
            thử đầu tiên. Chúng tôi luôn đồng hành để bạn chinh phục mọi mục
            tiêu.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-emerald-600 shadow-xl shadow-emerald-900/40 transition hover:scale-[1.05]"
            >
              Bắt đầu ngay
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Tư vấn miễn phí
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
