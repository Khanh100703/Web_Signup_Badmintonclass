import { useState } from "react";

export default function Footer() {
  const LOCATIONS = [
    {
      id: "cs1",
      label: "Cơ sở 1",
      iframe:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.1604030620785!2d106.7156386!3d10.807979!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175295146dbd6a9%3A0x2d7d467ba4e5175b!2zU8OgbiBD4bqndSBD4bqsbmcgTE9ORyBUQURBIERpMiA!5e0!3m2!1svi!2s!4v1730790000000",
    },
    {
      id: "cs2",
      label: "Cơ sở 2",
      iframe:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.551528902738!2d106.6707455!3d10.7734968!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f046839503d%3A0x989a482e18933239!2zU8OgbiBD4bqndSBD4bqsbmcgS8O9aSBIw7Jh!5e0!3m2!1svi!2s!4v1730791000000",
    },
    {
      id: "cs3",
      label: "Cơ sở 3",
      iframe:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.9707287052224!2d106.6413085!3d10.7087672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752e1cec67a961%3A0x3818d5b2ea4007ea!2zVHLGsOG7nW5nIMSQ4bqhYyBI4buZaCBWxINuIEhp4buHbg!5e0!3m2!1svi!2s!4v1730792000000",
    },
  ];

  const [active, setActive] = useState("cs1");
  const current = LOCATIONS.find((l) => l.id === active) ?? LOCATIONS[0];

  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
        {/* LEFT: Thông tin liên hệ */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Liên hệ & Địa điểm
          </h3>
          <p className="mt-2 text-gray-600">
            Hệ thống sân tập cầu lông — lớp cơ bản đến nâng cao, kèm riêng linh
            hoạt.
          </p>
          <div className="mt-4 text-sm text-gray-700 space-y-1">
            <div>📞 Hotline: 0352109405</div>
            <div>✉️ Email: khanhcr479@gmail.com</div>
            <div>🕒 08:00 – 22:00 (hàng ngày)</div>
          </div>

          {/* Nút chọn cơ sở */}
          <div className="mt-6 flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setActive(loc.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 transform ${
                  active === loc.id
                    ? "bg-black text-white border-black scale-105 shadow-md"
                    : "bg-white hover:shadow hover:scale-105"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Map với hiệu ứng fade */}
        <div className="rounded-2xl overflow-hidden border bg-white relative transition-all duration-500">
          <div key={current.id} className="animate-fadeIn">
            <iframe
              src={current.iframe}
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="font-semibold text-gray-800">
              SmashBadminton.com
            </span>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()} SmashBadminton — All rights reserved.
          </div>

          {/* Social icons (emoji style) */}
          <div className="flex items-center gap-4 text-gray-500 text-lg">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform hover:text-blue-600"
            >
              📘
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform hover:text-sky-500"
            >
              💬
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform hover:text-pink-600"
            >
              📸
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
