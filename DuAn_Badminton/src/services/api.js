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
  const isJson = ct.includes("json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    // Ưu tiên message từ backend; nếu là validator -> lấy errors[0].msg
    const message =
      (isJson &&
        (body?.message ||
          (Array.isArray(body?.errors) && body.errors[0]?.msg))) ||
      `HTTP ${res.status}`;
    return { ok: false, status: res.status, message, data: body };
  }

  if (isJson) {
    if (body && typeof body === "object" && "ok" in body) return body;
    return { ok: true, ...body };
  }
  return { ok: true, data: body };
}

// --- Hàm request có try/catch để bắt lỗi mạng/CORS/URL sai ---
async function request(method, url, body) {
  try {
    const fullUrl = (API_URL || "").replace(/\/+$/, "") + url; // bỏ dấu / dư ở cuối API_URL
    // Log nhẹ 1 lần cho DEV: API_URL và URL
    if (import.meta.env?.MODE !== "production" && !request._logged) {
      request._logged = true;
      console.log("[api] API_URL =", API_URL, "Example:", fullUrl);
    }

    const res = await fetch(fullUrl, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
      // credentials: "include", // chỉ bật nếu bạn dùng cookie/session
      mode: "cors",
    });
    return parse(res);
  } catch (err) {
    // Lỗi mạng/CORS/URL sai sẽ vào đây
    const message =
      err?.message ||
      "Network error (CORS/URL sai hoặc server không reachable).";
    return { ok: false, status: 0, message, data: null };
  }
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, b) => request("POST", url, b),
  put: (url, b) => request("PUT", url, b),
  patch: (url, b) => request("PATCH", url, b),
  del: (url) => request("DELETE", url),
  setToken: () => {}, // giữ API cũ, không cần dùng nữa
};
