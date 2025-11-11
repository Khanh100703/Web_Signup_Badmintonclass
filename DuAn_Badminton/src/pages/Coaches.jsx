import { useEffect, useState } from "react";
import { api } from "../services/api.js";

// SVG placeholder nội bộ (không cần mạng, tránh 404 lặp)
const SAFE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
       <defs>
         <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
           <stop offset='0%' stop-color='#f3f4f6'/>
           <stop offset='100%' stop-color='#ffffff'/>
         </linearGradient>
       </defs>
       <rect width='100%' height='100%' fill='url(#g)'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#9ca3af' font-family='Arial' font-size='20'>
         Ảnh huấn luyện viên
       </text>
     </svg>`
  );

function normalizeCoach(raw) {
  if (!raw || typeof raw !== "object") return null;
  const p =
    raw.photo_url ||
    raw.photoUrl ||
    raw.image_url ||
    raw.imageUrl ||
    raw.image ||
    raw.avatar_url ||
    raw.avatarUrl ||
    raw.avatar ||
    "";

  return {
    id: raw.id,
    name: raw.name || raw.fullname || raw.full_name || "Huấn luyện viên",
    email: raw.email || "",
    phone: raw.phone || raw.tel || "",
    experience: raw.experience || raw.bio || raw.note || raw.description || "",
    photo_url: typeof p === "string" ? p.trim() : "",
  };
}

function toBullets(text) {
  const t = String(text || "").trim();
  if (!t) return [];
  return t
    .split(/\r?\n|(?:\.\s+)/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function Coaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/coaches");
        const payload = Array.isArray(res?.data) ? res.data : res;
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        setCoaches(list.map(normalizeCoach).filter(Boolean));
      } catch {
        setErr("Không tải được danh sách huấn luyện viên");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center text-gray-600">
        Đang tải danh sách huấn luyện viên...
      </div>
    );

  if (err)
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-red-600">{err}</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-center text-2xl md:text-3xl font-extrabold tracking-wide text-black">
        HUẤN LUYỆN VIÊN
      </h1>

      <div className="mt-10 space-y-16">
        {coaches.map((c, idx) => {
          const bullets = toBullets(c.experience);
          const isEven = idx % 2 === 1;

          // chấp nhận: http/https, hoặc đường dẫn bắt đầu bằng "/"
          const raw = (c.photo_url || "").trim();
          let src = SAFE_PLACEHOLDER;
          if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) {
            src = raw;
          } else if (/^[\w\-./]+$/.test(raw)) {
            // hỗ trợ bạn lỡ lưu "images/coaches/xxx.jpg" (thiếu "/")
            src = "/" + raw.replace(/^\/+/, "");
          }

          return (
            <section
              key={c.id ?? idx}
              className="grid lg:grid-cols-2 gap-8 items-start hover:scale-[1.005] transition"
            >
              {/* Ảnh */}
              <div
                className={`rounded-2xl overflow-hidden border order-1 ${
                  isEven ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <img
                  src={src}
                  alt={c.name}
                  className="block w-full h-64 md:h-80 object-cover animate-fadeIn"
                  loading="lazy"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // ngắt vòng lặp trước khi fallback
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = SAFE_PLACEHOLDER;
                  }}
                />
              </div>

              {/* Thông tin + kinh nghiệm */}
              <div
                className={`order-2 ${isEven ? "lg:order-1" : "lg:order-2"}`}
              >
                <h2 className="text-2xl md:text-3xl font-extrabold text-black mb-4 uppercase link-underline">
                  {String(c.name || "").toUpperCase()}
                </h2>

                {bullets.length ? (
                  <ol className="list-decimal pl-5 space-y-2 text-[15px] leading-relaxed">
                    {bullets.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ol>
                ) : (
                  <ol className="list-decimal pl-5 space-y-2 text-[15px] leading-relaxed">
                    <li>
                      Huấn luyện viên cầu lông giàu kinh nghiệm giảng dạy.
                    </li>
                    <li>
                      Tận tâm, chuyên nghiệp và trách nhiệm trong đào tạo.
                    </li>
                    <li>
                      Định hướng phát triển phù hợp mọi trình độ học viên.
                    </li>
                  </ol>
                )}

                {(c.phone || c.email) && (
                  <div className="mt-4 text-sm text-gray-700 space-y-1">
                    {c.phone && <div>Điện thoại: {c.phone}</div>}
                    {c.email && <div>Email: {c.email}</div>}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
