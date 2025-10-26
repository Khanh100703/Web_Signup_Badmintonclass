export default function Contact() {
  const key = import.meta.env.VITE_GMAPS_API_KEY || "";
  const query = import.meta.env.VITE_MAP_QUERY || "";
  const lat = import.meta.env.VITE_MAP_LAT || "10.776889";
  const lng = import.meta.env.VITE_MAP_LNG || "106.700806";

  const mapSrc =
    key && query
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
          key
        )}&q=${encodeURIComponent(query)}`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          `${lat},${lng}`
        )}&z=15&output=embed`;

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    console.log("Contact form:", payload);
    alert("Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm.");
    e.currentTarget.reset();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Liên hệ</h1>
        <p className="text-gray-600 mb-6">
          Điền thông tin để được tư vấn khóa học phù hợp hoặc đặt lịch trải
          nghiệm.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Họ tên</label>
              <input
                name="name"
                required
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm">Số điện thoại</label>
              <input
                name="phone"
                type="tel"
                required
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm">Nội dung</label>
            <textarea
              name="message"
              rows={5}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Bạn muốn đăng ký lớp nào, thời gian mong muốn…"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-black text-white"
          >
            Gửi liên hệ
          </button>
        </form>
      </div>

      <div className="rounded-2xl overflow-hidden border h-[380px]">
        <iframe
          title="Google Map"
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
