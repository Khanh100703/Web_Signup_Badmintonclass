const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("auth_token");
}

export async function apiRequest(path, { method = "GET", body, token, headers = {} } = {}) {
  const fetchToken = token ?? getToken();
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (fetchToken) {
    finalHeaders.Authorization = `Bearer ${fetchToken}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message = data?.message || data || "Có lỗi xảy ra";
    throw new Error(message);
  }
  return data;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}
