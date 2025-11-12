import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

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
  const popularClasses = useMemo(() => (classes || []).slice(0, 6), [classes]);
  const [slide, setSlide] = useAutoSlide(featured.length, 6000);
  const coachCount = useMemo(() => {
    const ids = new Set();
    (classes || []).forEach((item) => {
      if (item?.coach_id) ids.add(item.coach_id);
    });
    return ids.size;
  }, [classes]);
  const locationCount = useMemo(() => {
    const ids = new Set();
    (classes || []).forEach((item) => {
      if (item?.location_id) ids.add(item.location_id);
    });
    return ids.size;
  }, [classes]);

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
              {featured[slide]?.image_url ? (
                <img
                  src={featured[slide].image_url}
                  alt={featured[slide]?.title || "Khóa học cầu lông"}
                  className="h-full w-full object-cover animate-fadeIn"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-gray-400">
                  Hình ảnh khóa học đang cập nhật
                </div>
              )}
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

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">Giới thiệu trung tâm</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Học Cầu Lông được thành lập với mục tiêu mang đến môi trường tập
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
            <div className="rounded-2xl border p-6 text-center">
              <div className="text-3xl font-semibold">{classes.length}</div>
              <div className="text-sm text-gray-500 mt-1">Khóa học đang mở</div>
            </div>
            <div className="rounded-2xl border p-6 text-center">
              <div className="text-3xl font-semibold">{coachCount}</div>
              <div className="text-sm text-gray-500 mt-1">Huấn luyện viên</div>
            </div>
            <div className="rounded-2xl border p-6 text-center">
              <div className="text-3xl font-semibold">{locationCount}</div>
              <div className="text-sm text-gray-500 mt-1">Sân tập</div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">
            Điều gì làm chúng tôi trở nên khác biệt?
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
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
        </div>
      </section>

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
                <div className="aspect-video bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover animate-fadeIn"
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
