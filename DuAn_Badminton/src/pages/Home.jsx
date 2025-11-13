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
    level: "Cơ bản",
    times: "Thứ 2 - 4 - 6 | 18:00 - 20:00",
    location: "Sân VHU Gym",
    tuition: "1.500.000đ/tháng",
  },
  {
    level: "Nâng cao",
    times: "Thứ 3 - 5 - 7 | 19:00 - 21:00",
    location: "Sân Quận 7",
    tuition: "1.900.000đ/tháng",
  },
  {
    level: "Thi đấu",
    times: "Cuối tuần | 8:00 - 11:00",
    location: "Sân Nhà thi đấu TDTT",
    tuition: "2.500.000đ/tháng",
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
      <section className="relative min-h-[340px] md:min-h-[380px] border-b overflow-hidden">
        {/* Background của slide hiện tại */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('/images/Banner/banner.webp')`,
          }}
        />
        {/* Lớp phủ làm mờ + tối nền */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

        {/* Nội dung slide */}
        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1 text-white">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-blue-100/80">
              {currentSlide.label}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              {currentSlide.title}
            </h1>
            <p className="mt-4 text-sm md:text-base text-blue-100/90 max-w-xl">
              {currentSlide.description}
            </p>
            <div className="mt-6">
              <Link
                to={currentSlide.to}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 hover:scale-[1.02] transition"
              >
                {currentSlide.buttonText}
              </Link>
            </div>
          </div>

          {/* Nút mũi tên + dot indicator */}
          <div className="flex flex-col items-center gap-4 md:items-end">
            <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-2">
              <button
                type="button"
                onClick={goPrev}
                className="h-8 w-8 rounded-full border border-white/50 text-white flex items-center justify-center hover:bg-white/20 transition"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="h-8 w-8 rounded-full border border-white/50 text-white flex items-center justify-center hover:bg-white/20 transition"
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
                      : "w-2.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== GIỚI THIỆU TRUNG TÂM ===== */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">Giới thiệu trung tâm</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              SmashBadminton được thành lập với mục tiêu mang đến môi trường tập
              luyện chuyên nghiệp, hiện đại và thân thiện cho mọi đối tượng học
              viên. Từ người mới làm quen đến vận động viên thi đấu, chúng tôi
              xây dựng giáo trình cá nhân hóa giúp bạn tiến bộ từng buổi học.
            </p>
            <ul className="mt-6 space-y-2 text-gray-700">
              <li>• Cam kết cải thiện kỹ thuật chỉ sau 4 buổi tập.</li>
              <li>• Lịch học linh hoạt theo khung giờ sáng – tối.</li>
              <li>• Đầy đủ dụng cụ tập luyện và phòng gym hỗ trợ thể lực.</li>
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border p-6 text-center bg-white">
              <div className="text-3xl font-semibold">{classes.length}</div>
              <div className="text-sm text-gray-500 mt-1">Khóa học đang mở</div>
            </div>
            <div className="rounded-2xl border p-6 text-center bg-white">
              <div className="text-3xl font-semibold">{coachCount}</div>
              <div className="text-sm text-gray-500 mt-1">Huấn luyện viên</div>
            </div>
            <div className="rounded-2xl border p-6 text-center bg-white">
              <div className="text-3xl font-semibold">{locationCount}</div>
              <div className="text-sm text-gray-500 mt-1">Sân tập</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LỊCH HỌC & HỌC PHÍ ===== */}
      <section className="py-16 bg-gray-50 border-y">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold">Lịch học & Học phí</h2>
              <p className="mt-3 text-gray-600">
                Lịch tập linh hoạt theo khung giờ cố định. Học viên có thể đăng
                ký thử buổi đầu để được đánh giá trình độ và tư vấn lộ trình phù
                hợp.
              </p>
            </div>
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr className="border-b">
                  <th className="p-3 text-left">Trình độ</th>
                  <th className="p-3 text-left">Khung giờ</th>
                  <th className="p-3 text-left">Địa điểm</th>
                  <th className="p-3 text-left">Học phí tham khảo</th>
                </tr>
              </thead>
              <tbody className="bg-white/70">
                {schedulePreview.map((row) => (
                  <tr key={row.level} className="border-b last:border-none">
                    <td className="p-3 font-medium">{row.level}</td>
                    <td className="p-3 text-gray-600">{row.times}</td>
                    <td className="p-3 text-gray-600">{row.location}</td>
                    <td className="p-3 font-semibold text-blue-600">
                      {row.tuition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            * Học phí đã bao gồm sân bãi, dụng cụ cơ bản và nước uống. Học viên
            đăng ký theo nhóm được giảm thêm 10%.
          </p>
        </div>
      </section>

      {/* ===== ĐIỂM KHÁC BIỆT ===== */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">
            Điều gì làm chúng tôi trở nên khác biệt?
          </h2>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-10 grid md:grid-cols-2 gap-6">
          {highlightPoints.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border p-6 bg-white/70"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== KHÓA HỌC NỔI BẬT ===== */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Khóa học nổi bật</h2>
              <p className="mt-2 text-gray-600">
                Lựa chọn phù hợp với mục tiêu luyện tập của bạn – từ kỹ thuật cơ
                bản đến chiến thuật thi đấu nâng cao.
              </p>
            </div>
            <Link
              to="/classes"
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-100 text-sm"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularClasses.map((item) => (
              <Link
                key={item.id}
                to={`/classes/${item.id}`}
                className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gray-40 0 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
                      Hình ảnh đang cập nhật
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-lg font-semibold">{item.title}</div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {item.description ||
                      "Khóa học cầu lông phù hợp cho mọi trình độ."}
                  </p>
                  <div className="mt-auto pt-4 text-sm text-gray-500">
                    {item.location_name || "Địa điểm linh hoạt"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA CUỐI TRANG ===== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">
            Sẵn sàng để bắt đầu hành trình của bạn?
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Đăng ký ngay hôm nay để được tư vấn lộ trình miễn phí và tham gia
            buổi học thử đầu tiên. Đừng bỏ lỡ cơ hội nâng cao thể lực, cải thiện
            kỹ thuật và kết nối với cộng đồng những người yêu cầu lông.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/classes"
              className="px-5 py-3 rounded-2xl bg-black text-white hover:opacity-90 hover:scale-[1.02] transition"
            >
              Đăng ký ngay
            </Link>
            <Link
              to="/contact"
              className="px-5 py-3 rounded-2xl border hover:shadow hover:scale-[1.02] transition"
            >
              Tư vấn miễn phí
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
