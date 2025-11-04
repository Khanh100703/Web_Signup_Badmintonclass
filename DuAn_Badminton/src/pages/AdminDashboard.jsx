import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "users", label: "Tài khoản" },
  { key: "coaches", label: "Huấn luyện viên" },
  { key: "classes", label: "Lớp học" },
  { key: "sessions", label: "Buổi học" },
  { key: "locations", label: "Địa điểm" },
  { key: "enrollments", label: "Đăng ký" },
  { key: "reports", label: "Thống kê" },
];

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", { hour12: false });
  } catch {
    return value;
  }
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [coaches, setCoaches] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [newCoach, setNewCoach] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    photo_url: "",
  });
  const [editingCoachId, setEditingCoachId] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);

  const [classesData, setClassesData] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [newClass, setNewClass] = useState({
    title: "",
    coach_id: "",
    location_id: "",
    level_id: "",
    category_id: "",
    capacity: "",
    description: "",
    image_url: "",
    start_date: "",
    end_date: "",
  });
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    capacity: "",
    notes: "",
  });
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedClassForSessions, setSelectedClassForSessions] = useState("");
  const [newSession, setNewSession] = useState({
    start_time: "",
    end_time: "",
    capacity: "",
  });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState([]);

  const [reportFilters, setReportFilters] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      by: "class",
    };
  });
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCoaches();
    loadClasses();
    loadLocations();
    loadLevels();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedClassForSessions) {
      loadSessions(selectedClassForSessions);
    }
  }, [selectedClassForSessions]);

  useEffect(() => {
    if (classesData.length && !selectedClassForSessions) {
      setSelectedClassForSessions(String(classesData[0].id));
    }
  }, [classesData, selectedClassForSessions]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReport();
    }
    if (activeTab === "enrollments" || activeTab === "overview") {
      loadEnrollments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReport();
    }
  }, [reportFilters]);

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res?.data || res?.users || []);
    } catch (err) {
      console.error("loadUsers", err);
    } finally {
      setUsersLoading(false);
    }
  }

  async function toggleUserLock(user) {
    try {
      const endpoint = user.is_locked ? "unlock" : "lock";
      await api.patch(`/api/admin/users/${user.id}/${endpoint}`);
      loadUsers();
    } catch (err) {
      alert(err?.message || "Không cập nhật được trạng thái tài khoản");
    }
  }

  async function changeUserRole(userId, role) {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role });
      loadUsers();
    } catch (err) {
      alert(err?.message || "Không đổi được vai trò");
    }
  }

  async function loadCoaches() {
    setCoachesLoading(true);
    try {
      const res = await api.get("/api/coaches");
      setCoaches(res?.data || []);
    } catch (err) {
      console.error("loadCoaches", err);
    } finally {
      setCoachesLoading(false);
    }
  }

  async function submitNewCoach(e) {
    e.preventDefault();
    try {
      await api.post("/api/coaches", newCoach);
      setNewCoach({ name: "", email: "", phone: "", experience: "", photo_url: "" });
      loadCoaches();
    } catch (err) {
      alert(err?.message || "Không tạo được huấn luyện viên");
    }
  }

  function startEditCoach(coach) {
    setEditingCoachId(coach.id);
    setEditingCoach({ ...coach });
  }

  async function saveCoach() {
    try {
      await api.put(`/api/coaches/${editingCoachId}`, editingCoach);
      setEditingCoachId(null);
      setEditingCoach(null);
      loadCoaches();
    } catch (err) {
      alert(err?.message || "Không cập nhật được thông tin huấn luyện viên");
    }
  }

  async function removeCoach(id) {
    if (!window.confirm("Bạn có chắc muốn xoá huấn luyện viên này?")) return;
    try {
      await api.del(`/api/coaches/${id}`);
      loadCoaches();
    } catch (err) {
      alert(err?.message || "Không xoá được huấn luyện viên");
    }
  }

  async function loadClasses() {
    setClassesLoading(true);
    try {
      const res = await api.get("/api/classes");
      setClassesData(res?.data || []);
    } catch (err) {
      console.error("loadClasses", err);
    } finally {
      setClassesLoading(false);
    }
  }

  async function submitNewClass(e) {
    e.preventDefault();
    try {
      const payload = {
        title: newClass.title,
        coach_id: newClass.coach_id ? Number(newClass.coach_id) : null,
        location_id: newClass.location_id ? Number(newClass.location_id) : null,
        level_id: newClass.level_id ? Number(newClass.level_id) : null,
        category_id: newClass.category_id ? Number(newClass.category_id) : null,
        capacity: newClass.capacity ? Number(newClass.capacity) : null,
        description: newClass.description || null,
        image_url: newClass.image_url || null,
        start_date: newClass.start_date || null,
        end_date: newClass.end_date || null,
      };
      await api.post("/api/classes", payload);
      setNewClass({
        title: "",
        coach_id: "",
        location_id: "",
        level_id: "",
        category_id: "",
        capacity: "",
        description: "",
        image_url: "",
        start_date: "",
        end_date: "",
      });
      loadClasses();
    } catch (err) {
      alert(err?.message || "Không tạo được lớp học");
    }
  }

  function startEditClass(clazz) {
    setEditingClassId(clazz.id);
    setEditingClass({
      title: clazz.title || "",
      coach_id: clazz.coach_id || "",
      location_id: clazz.location_id || "",
      level_id: clazz.level_id || "",
      category_id: clazz.category_id || "",
      capacity: clazz.class_capacity || "",
      description: clazz.description || "",
      image_url: clazz.image_url || "",
      start_date: toDateInput(clazz.start_date) || "",
      end_date: toDateInput(clazz.end_date) || "",
    });
  }

  async function saveClass() {
    try {
      const payload = {
        ...editingClass,
        coach_id: editingClass.coach_id ? Number(editingClass.coach_id) : null,
        location_id: editingClass.location_id ? Number(editingClass.location_id) : null,
        level_id: editingClass.level_id ? Number(editingClass.level_id) : null,
        category_id: editingClass.category_id ? Number(editingClass.category_id) : null,
        capacity: editingClass.capacity ? Number(editingClass.capacity) : null,
        start_date: editingClass.start_date || null,
        end_date: editingClass.end_date || null,
      };
      await api.put(`/api/classes/${editingClassId}`, payload);
      setEditingClassId(null);
      setEditingClass(null);
      loadClasses();
    } catch (err) {
      alert(err?.message || "Không cập nhật được lớp học");
    }
  }

  async function removeClass(id) {
    if (!window.confirm("Bạn có chắc muốn xoá lớp học này?")) return;
    try {
      await api.del(`/api/classes/${id}`);
      loadClasses();
    } catch (err) {
      alert(err?.message || "Không xoá được lớp học");
    }
  }

  async function loadLocations() {
    setLocationsLoading(true);
    try {
      const res = await api.get("/api/locations");
      setLocations(res?.data || []);
    } catch (err) {
      console.error("loadLocations", err);
    } finally {
      setLocationsLoading(false);
    }
  }

  async function submitNewLocation(e) {
    e.preventDefault();
    try {
      const payload = {
        name: newLocation.name,
        address: newLocation.address,
        capacity: newLocation.capacity ? Number(newLocation.capacity) : null,
        notes: newLocation.notes || null,
      };
      await api.post("/api/locations", payload);
      setNewLocation({ name: "", address: "", capacity: "", notes: "" });
      loadLocations();
    } catch (err) {
      alert(err?.message || "Không tạo được địa điểm");
    }
  }

  function startEditLocation(location) {
    setEditingLocationId(location.id);
    setEditingLocation({
      name: location.name || "",
      address: location.address || "",
      capacity: location.capacity || "",
      notes: location.notes || "",
    });
  }

  async function saveLocation() {
    try {
      const payload = {
        ...editingLocation,
        capacity: editingLocation.capacity ? Number(editingLocation.capacity) : null,
      };
      await api.put(`/api/locations/${editingLocationId}`, payload);
      setEditingLocationId(null);
      setEditingLocation(null);
      loadLocations();
    } catch (err) {
      alert(err?.message || "Không cập nhật được địa điểm");
    }
  }

  async function removeLocation(id) {
    if (!window.confirm("Bạn có chắc muốn xoá địa điểm này?")) return;
    try {
      await api.del(`/api/locations/${id}`);
      loadLocations();
    } catch (err) {
      alert(err?.message || "Không xoá được địa điểm");
    }
  }

  async function loadSessions(classId) {
    setSessionsLoading(true);
    try {
      const res = await api.get(`/api/sessions/class/${classId}`);
      const arr = Array.isArray(res) ? res : res?.data || [];
      setSessions(arr);
    } catch (err) {
      console.error("loadSessions", err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }

  async function submitNewSession(e) {
    e.preventDefault();
    if (!selectedClassForSessions) return;
    try {
      const payload = {
        class_id: Number(selectedClassForSessions),
        start_time: fromDateTimeLocal(newSession.start_time),
        end_time: fromDateTimeLocal(newSession.end_time),
        capacity: newSession.capacity ? Number(newSession.capacity) : null,
      };
      await api.post("/api/sessions", payload);
      setNewSession({ start_time: "", end_time: "", capacity: "" });
      loadSessions(selectedClassForSessions);
    } catch (err) {
      alert(err?.message || "Không tạo được buổi học");
    }
  }

  function startEditSession(session) {
    setEditingSessionId(session.id);
    setEditingSession({
      start_time: toDateTimeLocal(session.start_time) || "",
      end_time: toDateTimeLocal(session.end_time) || "",
      capacity: session.capacity || "",
    });
  }

  async function saveSession() {
    try {
      const payload = {
        start_time: fromDateTimeLocal(editingSession.start_time),
        end_time: fromDateTimeLocal(editingSession.end_time),
        capacity: editingSession.capacity ? Number(editingSession.capacity) : null,
      };
      await api.put(`/api/sessions/${editingSessionId}`, payload);
      setEditingSessionId(null);
      setEditingSession(null);
      loadSessions(selectedClassForSessions);
    } catch (err) {
      alert(err?.message || "Không cập nhật được buổi học");
    }
  }

  async function removeSession(id) {
    if (!window.confirm("Bạn có chắc muốn xoá buổi học này?")) return;
    try {
      await api.del(`/api/sessions/${id}`);
      loadSessions(selectedClassForSessions);
    } catch (err) {
      alert(err?.message || "Không xoá được buổi học");
    }
  }

  async function notifySession(id) {
    try {
      const res = await api.post(`/api/sessions/${id}/notify`);
      if (res?.ok) {
        alert(
          res.sent
            ? `Đã gửi thông báo cho ${res.sent} học viên.`
            : "Không có học viên nào được gửi thông báo."
        );
      } else {
        alert(res?.message || "Gửi thông báo thất bại");
      }
    } catch (err) {
      alert(err?.message || "Không gửi được thông báo");
    }
  }

  async function loadEnrollments() {
    setEnrollmentsLoading(true);
    try {
      const res = await api.get("/api/enrollments");
      setEnrollments(res?.data || []);
    } catch (err) {
      console.error("loadEnrollments", err);
    } finally {
      setEnrollmentsLoading(false);
    }
  }

  async function updateEnrollmentStatus(id, status) {
    try {
      await api.patch(`/api/enrollments/${id}/status`, { status });
      loadEnrollments();
    } catch (err) {
      alert(err?.message || "Không cập nhật được trạng thái đăng ký");
    }
  }

  async function loadLevels() {
    try {
      const res = await api.get("/api/levels");
      setLevels(res?.data || []);
    } catch (err) {
      console.error("loadLevels", err);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/api/categories");
      setCategories(res?.data || []);
    } catch (err) {
      console.error("loadCategories", err);
    }
  }

  async function loadReport() {
    setReportLoading(true);
    try {
      const query = new URLSearchParams({
        by: reportFilters.by,
        from: reportFilters.from,
        to: reportFilters.to,
      }).toString();
      const res = await api.get(`/api/reports/summary?${query}`);
      setReportData(res?.data || []);
    } catch (err) {
      console.error("loadReport", err);
      setReportData([]);
    } finally {
      setReportLoading(false);
    }
  }

  const overviewStats = useMemo(() => {
    const totalStudents = enrollments.filter((e) => e.status === "ENROLLED").length;
    return [
      { label: "Khóa học", value: classesData.length },
      { label: "Huấn luyện viên", value: coaches.length },
      { label: "Địa điểm", value: locations.length },
      { label: "Học viên đang tham gia", value: totalStudents },
    ];
  }, [classesData.length, coaches.length, locations.length, enrollments]);

  function renderOverviewTab() {
    return (
      <div className="space-y-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((item) => (
            <div key={item.label} className="rounded-2xl border p-6 bg-white">
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Hoạt động gần đây</h2>
          <p className="text-sm text-gray-600">
            Sử dụng các tab bên trên để quản lý tài khoản, lớp học, buổi học và theo dõi
            báo cáo thống kê. Các thay đổi sẽ được cập nhật theo thời gian thực cho toàn bộ hệ thống.
          </p>
        </div>
      </div>
    );
  }

  function renderUsersTab() {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quản lý tài khoản</h2>
        {usersLoading ? (
          <div className="p-6 text-gray-500">Đang tải danh sách người dùng…</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Tên</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Vai trò</th>
                  <th className="p-3 text-left">Trạng thái</th>
                  <th className="p-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3">
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value)}
                        className="border rounded-lg px-3 py-1"
                      >
                        <option value="USER">USER</option>
                        <option value="COACH">COACH</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {user.is_locked ? (
                        <span className="text-red-500 font-semibold">Đã khoá</span>
                      ) : (
                        <span className="text-green-600">Hoạt động</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleUserLock(user)}
                        className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                      >
                        {user.is_locked ? "Mở khoá" : "Khoá tài khoản"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                      Chưa có người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderCoachesTab() {
    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Thêm huấn luyện viên</h2>
          <form
            onSubmit={submitNewCoach}
            className="grid md:grid-cols-2 gap-4 rounded-2xl border p-6 bg-white"
          >
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Tên</label>
              <input
                required
                value={newCoach.name}
                onChange={(e) => setNewCoach((v) => ({ ...v, name: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Email</label>
              <input
                type="email"
                value={newCoach.email}
                onChange={(e) => setNewCoach((v) => ({ ...v, email: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Số điện thoại</label>
              <input
                value={newCoach.phone}
                onChange={(e) => setNewCoach((v) => ({ ...v, phone: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Ảnh đại diện (URL)</label>
              <input
                value={newCoach.photo_url}
                onChange={(e) => setNewCoach((v) => ({ ...v, photo_url: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold">Kinh nghiệm</label>
              <textarea
                value={newCoach.experience}
                onChange={(e) => setNewCoach((v) => ({ ...v, experience: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-black text-white">Thêm huấn luyện viên</button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Danh sách huấn luyện viên</h2>
          {coachesLoading ? (
            <div className="p-6 text-gray-500">Đang tải dữ liệu…</div>
          ) : (
            <div className="space-y-4">
              {coaches.map((coach) => (
                <div key={coach.id} className="rounded-2xl border p-5 bg-white">
                  {editingCoachId === coach.id ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingCoach.name}
                        onChange={(e) =>
                          setEditingCoach((v) => ({ ...v, name: e.target.value }))
                        }
                      />
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingCoach.email || ""}
                        onChange={(e) =>
                          setEditingCoach((v) => ({ ...v, email: e.target.value }))
                        }
                      />
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingCoach.phone || ""}
                        onChange={(e) =>
                          setEditingCoach((v) => ({ ...v, phone: e.target.value }))
                        }
                      />
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingCoach.photo_url || ""}
                        onChange={(e) =>
                          setEditingCoach((v) => ({ ...v, photo_url: e.target.value }))
                        }
                      />
                      <textarea
                        className="md:col-span-2 border rounded-xl px-3 py-2"
                        value={editingCoach.experience || ""}
                        onChange={(e) =>
                          setEditingCoach((v) => ({ ...v, experience: e.target.value }))
                        }
                      />
                      <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCoachId(null);
                            setEditingCoach(null);
                          }}
                          className="px-4 py-2 rounded-xl border"
                        >
                          Huỷ
                        </button>
                        <button
                          type="button"
                          onClick={saveCoach}
                          className="px-4 py-2 rounded-xl bg-black text-white"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{coach.name}</div>
                        <div className="text-sm text-gray-600">{coach.email || "(chưa có email)"}</div>
                        <div className="text-sm text-gray-600">{coach.phone || "(chưa có SĐT)"}</div>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {coach.experience || "Chưa cập nhật mô tả"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditCoach(coach)}
                          className="px-3 py-2 rounded-xl border"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => removeCoach(coach.id)}
                          className="px-3 py-2 rounded-xl border text-red-600"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!coaches.length && (
                <div className="rounded-2xl border p-6 text-center text-gray-500">
                  Chưa có huấn luyện viên.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderClassesTab() {
    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tạo lớp học</h2>
          <form
            onSubmit={submitNewClass}
            className="grid lg:grid-cols-2 gap-4 rounded-2xl border p-6 bg-white"
          >
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-semibold">Tên lớp</label>
              <input
                required
                value={newClass.title}
                onChange={(e) => setNewClass((v) => ({ ...v, title: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Huấn luyện viên</label>
              <select
                required
                value={newClass.coach_id}
                onChange={(e) => setNewClass((v) => ({ ...v, coach_id: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">-- Chọn --</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Địa điểm</label>
              <select
                value={newClass.location_id}
                onChange={(e) => setNewClass((v) => ({ ...v, location_id: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">-- Chọn --</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Trình độ</label>
              <select
                value={newClass.level_id}
                onChange={(e) => setNewClass((v) => ({ ...v, level_id: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">-- Chọn --</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Danh mục</label>
              <select
                value={newClass.category_id}
                onChange={(e) =>
                  setNewClass((v) => ({ ...v, category_id: e.target.value }))
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">-- Chọn --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Sức chứa</label>
              <input
                type="number"
                min="0"
                value={newClass.capacity}
                onChange={(e) => setNewClass((v) => ({ ...v, capacity: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Ảnh minh hoạ</label>
              <input
                value={newClass.image_url}
                onChange={(e) => setNewClass((v) => ({ ...v, image_url: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Ngày bắt đầu</label>
              <input
                type="date"
                value={newClass.start_date}
                onChange={(e) => setNewClass((v) => ({ ...v, start_date: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Ngày kết thúc</label>
              <input
                type="date"
                value={newClass.end_date}
                onChange={(e) => setNewClass((v) => ({ ...v, end_date: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-sm font-semibold">Mô tả</label>
              <textarea
                value={newClass.description}
                onChange={(e) => setNewClass((v) => ({ ...v, description: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
              />
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-black text-white">Tạo lớp học</button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Danh sách lớp học</h2>
          {classesLoading ? (
            <div className="p-6 text-gray-500">Đang tải dữ liệu…</div>
          ) : (
            <div className="space-y-4">
              {classesData.map((clazz) => (
                <div key={clazz.id} className="rounded-2xl border p-5 bg-white">
                  {editingClassId === clazz.id ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingClass.title}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, title: e.target.value }))
                        }
                      />
                      <select
                        className="border rounded-xl px-3 py-2"
                        value={editingClass.coach_id}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, coach_id: e.target.value }))
                        }
                      >
                        <option value="">-- Chọn HLV --</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="border rounded-xl px-3 py-2"
                        value={editingClass.location_id}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, location_id: e.target.value }))
                        }
                      >
                        <option value="">-- Chọn địa điểm --</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="border rounded-xl px-3 py-2"
                        type="number"
                        value={editingClass.capacity}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, capacity: e.target.value }))
                        }
                      />
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingClass.image_url || ""}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, image_url: e.target.value }))
                        }
                      />
                      <input
                        type="date"
                        className="border rounded-xl px-3 py-2"
                        value={editingClass.start_date || ""}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, start_date: e.target.value }))
                        }
                      />
                      <input
                        type="date"
                        className="border rounded-xl px-3 py-2"
                        value={editingClass.end_date || ""}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, end_date: e.target.value }))
                        }
                      />
                      <textarea
                        className="md:col-span-2 border rounded-xl px-3 py-2"
                        value={editingClass.description || ""}
                        onChange={(e) =>
                          setEditingClass((v) => ({ ...v, description: e.target.value }))
                        }
                      />
                      <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClassId(null);
                            setEditingClass(null);
                          }}
                          className="px-4 py-2 rounded-xl border"
                        >
                          Huỷ
                        </button>
                        <button
                          type="button"
                          onClick={saveClass}
                          className="px-4 py-2 rounded-xl bg-black text-white"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{clazz.title}</div>
                        <div className="text-sm text-gray-500">
                          HLV: {clazz.coach_name || "Đang cập nhật"} • Sức chứa: {clazz.class_capacity || "—"}
                        </div>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                          {clazz.description || "Chưa có mô tả"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditClass(clazz)}
                          className="px-3 py-2 rounded-xl border"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => removeClass(clazz.id)}
                          className="px-3 py-2 rounded-xl border text-red-600"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!classesData.length && (
                <div className="rounded-2xl border p-6 text-center text-gray-500">
                  Chưa có lớp học.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSessionsTab() {
    if (!classesData.length)
      return (
        <div className="rounded-2xl border p-6 text-center text-gray-500">
          Chưa có lớp học để tạo buổi học.
        </div>
      );
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Quản lý buổi học</h2>
          <select
            value={selectedClassForSessions}
            onChange={(e) => setSelectedClassForSessions(e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            {classesData.map((clazz) => (
              <option key={clazz.id} value={clazz.id}>
                {clazz.title}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={submitNewSession}
          className="grid md:grid-cols-4 gap-4 rounded-2xl border p-6 bg-white"
        >
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold">Bắt đầu</label>
            <input
              type="datetime-local"
              required
              value={newSession.start_time}
              onChange={(e) => setNewSession((v) => ({ ...v, start_time: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold">Kết thúc</label>
            <input
              type="datetime-local"
              required
              value={newSession.end_time}
              onChange={(e) => setNewSession((v) => ({ ...v, end_time: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Sức chứa</label>
            <input
              type="number"
              value={newSession.capacity}
              onChange={(e) => setNewSession((v) => ({ ...v, capacity: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button className="px-4 py-2 rounded-xl bg-black text-white">Tạo buổi học</button>
          </div>
        </form>

        <div className="rounded-2xl border overflow-hidden">
          {sessionsLoading ? (
            <div className="p-6 text-gray-500">Đang tải danh sách buổi học…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Bắt đầu</th>
                  <th className="p-3 text-left">Kết thúc</th>
                  <th className="p-3 text-left">Sức chứa</th>
                  <th className="p-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="p-3">
                      {editingSessionId === session.id ? (
                        <input
                          type="datetime-local"
                          value={editingSession.start_time}
                          onChange={(e) =>
                            setEditingSession((v) => ({ ...v, start_time: e.target.value }))
                          }
                          className="border rounded-xl px-3 py-2"
                        />
                      ) : (
                        formatDateTime(session.start_time)
                      )}
                    </td>
                    <td className="p-3">
                      {editingSessionId === session.id ? (
                        <input
                          type="datetime-local"
                          value={editingSession.end_time}
                          onChange={(e) =>
                            setEditingSession((v) => ({ ...v, end_time: e.target.value }))
                          }
                          className="border rounded-xl px-3 py-2"
                        />
                      ) : (
                        formatDateTime(session.end_time)
                      )}
                    </td>
                    <td className="p-3">
                      {editingSessionId === session.id ? (
                        <input
                          type="number"
                          value={editingSession.capacity}
                          onChange={(e) =>
                            setEditingSession((v) => ({ ...v, capacity: e.target.value }))
                          }
                          className="border rounded-xl px-3 py-2 w-24"
                        />
                      ) : (
                        session.capacity ?? "—"
                      )}
                    </td>
                    <td className="p-3 flex flex-wrap gap-2">
                      {editingSessionId === session.id ? (
                        <>
                          <button
                            onClick={saveSession}
                            className="px-3 py-1.5 rounded-xl border bg-black text-white"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingSessionId(null);
                              setEditingSession(null);
                            }}
                            className="px-3 py-1.5 rounded-xl border"
                          >
                            Huỷ
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditSession(session)}
                            className="px-3 py-1.5 rounded-xl border"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => notifySession(session.id)}
                            className="px-3 py-1.5 rounded-xl border"
                          >
                            Gửi email nhắc
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeSession(session.id)}
                        className="px-3 py-1.5 rounded-xl border text-red-600"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
                {!sessions.length && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={4}>
                      Chưa có buổi học.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  function renderLocationsTab() {
    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Thêm địa điểm</h2>
          <form
            onSubmit={submitNewLocation}
            className="grid md:grid-cols-2 gap-4 rounded-2xl border p-6 bg-white"
          >
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Tên địa điểm</label>
              <input
                required
                value={newLocation.name}
                onChange={(e) => setNewLocation((v) => ({ ...v, name: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Địa chỉ</label>
              <input
                value={newLocation.address}
                onChange={(e) => setNewLocation((v) => ({ ...v, address: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Sức chứa</label>
              <input
                type="number"
                value={newLocation.capacity}
                onChange={(e) => setNewLocation((v) => ({ ...v, capacity: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold">Ghi chú</label>
              <textarea
                value={newLocation.notes}
                onChange={(e) => setNewLocation((v) => ({ ...v, notes: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-black text-white">Thêm địa điểm</button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Danh sách địa điểm</h2>
          {locationsLoading ? (
            <div className="p-6 text-gray-500">Đang tải dữ liệu…</div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="rounded-2xl border p-5 bg-white">
                  {editingLocationId === location.id ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingLocation.name}
                        onChange={(e) =>
                          setEditingLocation((v) => ({ ...v, name: e.target.value }))
                        }
                      />
                      <input
                        className="border rounded-xl px-3 py-2"
                        value={editingLocation.address || ""}
                        onChange={(e) =>
                          setEditingLocation((v) => ({ ...v, address: e.target.value }))
                        }
                      />
                      <input
                        className="border rounded-xl px-3 py-2"
                        type="number"
                        value={editingLocation.capacity || ""}
                        onChange={(e) =>
                          setEditingLocation((v) => ({ ...v, capacity: e.target.value }))
                        }
                      />
                      <textarea
                        className="md:col-span-2 border rounded-xl px-3 py-2"
                        value={editingLocation.notes || ""}
                        onChange={(e) =>
                          setEditingLocation((v) => ({ ...v, notes: e.target.value }))
                        }
                      />
                      <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLocationId(null);
                            setEditingLocation(null);
                          }}
                          className="px-4 py-2 rounded-xl border"
                        >
                          Huỷ
                        </button>
                        <button
                          type="button"
                          onClick={saveLocation}
                          className="px-4 py-2 rounded-xl bg-black text-white"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{location.name}</div>
                        <div className="text-sm text-gray-600">{location.address || "(chưa có địa chỉ)"}</div>
                        <div className="text-sm text-gray-600">Sức chứa: {location.capacity || "—"}</div>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                          {location.notes || "Chưa có ghi chú"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditLocation(location)}
                          className="px-3 py-2 rounded-xl border"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => removeLocation(location.id)}
                          className="px-3 py-2 rounded-xl border text-red-600"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!locations.length && (
                <div className="rounded-2xl border p-6 text-center text-gray-500">
                  Chưa có địa điểm.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderEnrollmentsTab() {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Đăng ký học viên</h2>
        {enrollmentsLoading ? (
          <div className="p-6 text-gray-500">Đang tải dữ liệu…</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Học viên</th>
                  <th className="p-3 text-left">Lớp học</th>
                  <th className="p-3 text-left">Buổi học</th>
                  <th className="p-3 text-left">Trạng thái</th>
                  <th className="p-3 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((en) => (
                  <tr key={en.id} className="border-t">
                    <td className="p-3">
                      <div className="font-semibold">{en.user_name}</div>
                      <div className="text-xs text-gray-500">{en.user_email}</div>
                    </td>
                    <td className="p-3">{en.class_title}</td>
                    <td className="p-3">{formatDateTime(en.start_time)}</td>
                    <td className="p-3">
                      <select
                        value={en.status}
                        onChange={(e) => updateEnrollmentStatus(en.id, e.target.value)}
                        className="border rounded-xl px-3 py-1"
                      >
                        <option value="ENROLLED">ENROLLED</option>
                        <option value="WAITLIST">WAITLIST</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="p-3 text-gray-500">{formatDateTime(en.created_at)}</td>
                  </tr>
                ))}
                {!enrollments.length && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                      Chưa có đăng ký nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderReportsTab() {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border p-6 bg-white grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold">Thống kê theo</label>
            <select
              value={reportFilters.by}
              onChange={(e) => setReportFilters((v) => ({ ...v, by: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="class">Lớp học</option>
              <option value="coach">Huấn luyện viên</option>
              <option value="location">Địa điểm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold">Từ ngày</label>
            <input
              type="date"
              value={reportFilters.from}
              onChange={(e) => setReportFilters((v) => ({ ...v, from: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Đến ngày</label>
            <input
              type="date"
              value={reportFilters.to}
              onChange={(e) => setReportFilters((v) => ({ ...v, to: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={loadReport}
              className="px-4 py-2 rounded-xl border bg-black text-white"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden">
          {reportLoading ? (
            <div className="p-6 text-gray-500">Đang tổng hợp dữ liệu…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Tên</th>
                  <th className="p-3 text-left">Số lượt đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">{row.name || row.title}</td>
                    <td className="p-3">{row.enrolls}</td>
                  </tr>
                ))}
                {!reportData.length && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={2}>
                      Không có dữ liệu trong khoảng thời gian này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  function renderActiveTab() {
    switch (activeTab) {
      case "users":
        return renderUsersTab();
      case "coaches":
        return renderCoachesTab();
      case "classes":
        return renderClassesTab();
      case "sessions":
        return renderSessionsTab();
      case "locations":
        return renderLocationsTab();
      case "enrollments":
        return renderEnrollmentsTab();
      case "reports":
        return renderReportsTab();
      default:
        return renderOverviewTab();
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bảng điều khiển quản trị</h1>
          <p className="mt-2 text-sm text-gray-600">
            Theo dõi toàn bộ hoạt động của hệ thống lớp học cầu lông: tài khoản, lớp học,
            buổi học và báo cáo thống kê.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl border text-sm transition ${
              activeTab === tab.key
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-10 space-y-6">{renderActiveTab()}</div>
    </div>
  );
}
