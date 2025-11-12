import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    // ép Vite cho PostCSS xử lý trước, hạn chế transform gây lỗi at-rule lạ
    transformer: "postcss",
  },
});
