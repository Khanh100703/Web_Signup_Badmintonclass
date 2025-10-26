export default function Footer() {
  // Cấu hình qua .env (frontend):
  // - VITE_GMAPS_API_KEY (optional)
  // - VITE_MAP_QUERY: ví dụ "San Cau Long ABC, Ho Chi Minh"
  // - VITE_MAP_LAT / VITE_MAP_LNG: toạ độ (fallback nếu không có QUERY+KEY)
  const key = import.meta.env.VITE_GMAPS_API_KEY || "";
  const query = import.meta.env.VITE_MAP_QUERY || "";
  const lat = import.meta.env.VITE_MAP_LAT || "10.776889";
  const lng = import.meta.env.VITE_MAP_LNG || "106.700806";

  // Ưu tiên dùng embed/v1/place khi có KEY + QUERY → map đẹp hơn, cố định POI
  const src =
    key && query
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
          key
        )}&q=${encodeURIComponent(query)}`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          `${lat},${lng}`
        )}&z=15&output=embed`;

  return (
    <footer className="border-t">
      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold">Liên hệ & Địa điểm</h3>
          <p className="mt-2 text-gray-600">
            Sân tập cầu lông – Hệ thống lớp cơ bản đến nâng cao, kèm riêng linh
            hoạt.
          </p>
          <div className="mt-4 text-sm text-gray-700 space-y-1">
            <div>Hotline: 09xx xxx xxx</div>
            <div>Email: contact@yourexample.com</div>
            <div>Giờ hoạt động: 8:00 – 22:00</div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border">
          <iframe
            title="Google Map"
            src={src}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500 flex items-center justify-between">
          <div>
            © {new Date().getFullYear()} HocCauLong — All rights reserved.
          </div>
          <div className="flex gap-4">
            <a className="hover:underline" href="/privacy">
              Privacy
            </a>
            <a className="hover:underline" href="/terms">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
