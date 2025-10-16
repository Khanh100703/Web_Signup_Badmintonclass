import { apiRequest, buildQuery } from "./client";

export const authApi = {
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: payload }),
  register: (payload) =>
    apiRequest("/auth/register", { method: "POST", body: payload }),
  getProfile: () => apiRequest("/me"),
  updateProfile: (payload) =>
    apiRequest("/me", { method: "PUT", body: payload }),
};

export const classesApi = {
  list: (filters = {}) =>
    apiRequest(`/classes${buildQuery(filters)}`),
  getDetail: (id) => apiRequest(`/classes/${id}`),
};

export const coachesApi = {
  list: () => apiRequest("/coaches"),
};

export const enrollmentApi = {
  enroll: (sessionId) =>
    apiRequest("/enrollments", {
      method: "POST",
      body: { session_id: sessionId },
    }),
  cancel: (enrollmentId) =>
    apiRequest(`/enrollments/${enrollmentId}`, { method: "DELETE" }),
};

export const scheduleApi = {
  mySchedule: () => apiRequest("/me/schedule"),
};

export const adminApi = {
  listUsers: (params = {}) =>
    apiRequest(`/admin/users${buildQuery(params)}`),
};
