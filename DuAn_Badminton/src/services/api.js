// src/services/api.js
const API_URL = import.meta?.env?.VITE_API_URL || "http://localhost:5000";

function authHeader() {
  const t =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function parse(res) {
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("json") ? await res.json() : await res.text();

  if (!res.ok) {
    // Luôn trả về object có ok=false để UI hiển thị lỗi
    const message = (body && body.message) || `HTTP ${res.status}`;
    return { ok: false, status: res.status, message, data: body };
  }
  // Chuẩn hóa trả về: đảm bảo có ok=true
  if (body && typeof body === "object" && "ok" in body) return body;
  if (typeof body === "object") return { ok: true, ...body };
  return { ok: true, data: body };
}

async function request(method, url, body) {
  const res = await fetch(API_URL + url, {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parse(res);
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, b) => request("POST", url, b),
  put: (url, b) => request("PUT", url, b),
  del: (url) => request("DELETE", url),
  setToken: () => {}, // giữ API cũ, không cần dùng nữa
};
