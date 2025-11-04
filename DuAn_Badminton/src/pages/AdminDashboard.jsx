import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "users", label: "Tài khoản" },
  { id: "coaches", label: "Huấn luyện viên" },
  { id: "classes", label: "Lớp học" },
  { id: "sessions", label: "Buổi học" },
  { id: "locations", label: "Địa điểm" },
  { id: "enrollments", label: "Đăng ký" },
  { id: "reports", label: "Thống kê" },
];

const roleOptions = [
  { value: "USER", label: "Học viên" },
  { value: "COACH", label: "Huấn luyện viên" },
  { value: "ADMIN", label: "Quản trị" },
];

const initialCoachForm = {
  name: "",
  email: "",
  phone: "",
  experience: "",
  photo_url: "",
};

const initialClassForm = {
  title: "",
  coach_id: "",
  location_id: "",
  level_id: "",
  category_id: "",
  capacity: "",
  description: "",
  image_url: "",
};

const initialLocationForm = {
  name: "",
  address: "",
};

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState([]);
  const [summaryFilter, setSummaryFilter] = useState("class");
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState([]);

  const [coachForm, setCoachForm] = useState(initialCoachForm);
  const [classForm, setClassForm] = useState(initialClassForm);
  const [locationForm, setLocationForm] = useState(initialLocationForm);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadSummary(summaryFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryFilter]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [
        usersRes,
        coachesRes,
        classesRes,
        locationsRes,
        sessionsRes,
        enrollmentsRes,
        summaryRes,
        levelsRes,
        categoriesRes,
      ] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/coaches"),
        api.get("/api/classes"),
        api.get("/api/locations"),
        api.get("/api/sessions?limit=100"),
        api.get("/api/enrollments/admin"),
        api.get(`/api/reports/summary?by=${summaryFilter}`),
        api.get("/api/levels"),
        api.get("/api/categories"),
      ]);

      setUsers(usersRes?.data || []);
      setCoaches(coachesRes?.data || []);
      setClasses(classesRes?.data || []);
      setLocations(locationsRes?.data || []);
      setSessions(sessionsRes?.data || []);
      setEnrollments(enrollmentsRes?.data || []);
      setSummary(summaryRes?.data || []);
      setLevels(levelsRes?.data || []);
      setCategories(categoriesRes?.data || []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Không tải được dữ liệu quản trị");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary(by) {
    try {
      const res = await api.get(`/api/reports/summary?by=${by}`);
      setSummary(res?.data || []);
    } catch (e) {
      console.error(e);
      setFeedback(e?.message || "Không tải được thống kê");
    }
  }

  async function refreshUsers() {
    const res = await api.get("/api/admin/users");
    setUsers(res?.data || []);
  }

  async function refreshCoaches() {
    const res = await api.get("/api/coaches");
    setCoaches(res?.data || []);
  }

  async function refreshClasses() {
    const res = await api.get("/api/classes");
    setClasses(res?.data || []);
  }

  async function refreshLocations() {
    const res = await api.get("/api/locations");
    setLocations(res?.data || []);
  }

  async function refreshSessions() {
    const res = await api.get("/api/sessions?limit=100");
    setSessions(res?.data || []);
  }

  async function refreshEnrollments() {
    const res = await api.get("/api/enrollments/admin");
    setEnrollments(res?.data || []);
  }

  async function handleLock(id, lock) {
    try {
      setFeedback("");
      await api.patch(`/api/admin/users/${id}/${lock ? "lock" : "unlock"}`);
      refreshUsers();
      setFeedback(lock ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
    } catch (e) {
      setFeedback(e?.message || "Không thể cập nhật trạng thái tài khoản");
    }
  }

  async function handleRole(id, role) {
    try {
      setFeedback("");
      await api.patch(`/api/admin/users/${id}/role`, { role });
      refreshUsers();
      setFeedback("Đã cập nhật vai trò người dùng");
    } catch (e) {
      setFeedback(e?.message || "Không thể cập nhật vai trò");
    }
  }

  async function handleCoachSubmit(e) {
    e.preventDefault();
    try {
      setFeedback("");
      await api.post("/api/coaches", coachForm);
      setCoachForm(initialCoachForm);
      setFeedback("Đã thêm huấn luyện viên mới");
      refreshCoaches();
    } catch (e) {
      setFeedback(e?.message || "Không thể thêm huấn luyện viên");
    }
  }

  async function handleClassSubmit(e) {
    e.preventDefault();
    const payload = {
      ...classForm,
      coach_id: classForm.coach_id ? Number(classForm.coach_id) : null,
      location_id: classForm.location_id
        ? Number(classForm.location_id)
        : null,
      level_id: classForm.level_id ? Number(classForm.level_id) : null,
      category_id: classForm.category_id
        ? Number(classForm.category_id)
        : null,
      capacity: (() => {
        const cap = Number(classForm.capacity);
        return Number.isFinite(cap) && cap > 0 ? cap : 0;
      })(),
    };
    try {
      setFeedback("");
      await api.post("/api/classes", payload);
      setClassForm(initialClassForm);
      setFeedback("Đã tạo lớp học mới");
      refreshClasses();
    } catch (e) {
      setFeedback(e?.message || "Không thể tạo lớp học");
    }
  }

  async function handleLocationSubmit(e) {
    e.preventDefault();
    try {
      setFeedback("");
      await api.post("/api/locations", locationForm);
      setLocationForm(initialLocationForm);
      setFeedback("Đã thêm địa điểm mới");
      refreshLocations();
    } catch (e) {
      setFeedback(e?.message || "Không thể thêm địa điểm");
    }
  }

  const overviewStats = useMemo(
    () => [
      { label: "Tổng người dùng", value: users.length },
      { label: "Huấn luyện viên", value: coaches.length },
      { label: "Lớp học", value: classes.length },
      { label: "Buổi học sắp tới", value: sessions.length },
      { label: "Đăng ký gần đây", value: enrollments.length },
    ],
    [users, coaches, classes, sessions, enrollments]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Trang quản trị</h1>
          <p className="text-gray-600 mt-2">
            Quản lý toàn bộ người dùng, lớp học, buổi học và báo cáo thống kê.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-xl border text-sm hover:shadow"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {feedback && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700">
          {feedback}
        </div>
      )}
      {error && !loading && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl border text-sm transition ${
              activeTab === tab.id
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 text-gray-500">Đang tải dữ liệu quản trị…</div>
      ) : (
        <div className="mt-8 space-y-8">
          {activeTab === "overview" && (
            <section className="space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {overviewStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border p-5">
                    <div className="text-sm text-gray-500">{stat.label}</div>
                    <div className="text-3xl font-semibold mt-2">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border p-5">
                <h2 className="text-xl font-semibold">Buổi học sắp diễn ra</h2>
                <div className="mt-4 space-y-3">
                  {sessions.slice(0, 6).map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                    >
                      <div>
                        <div className="font-medium">{session.class_title}</div>
                        <div className="text-sm text-gray-500">
                          {dateFmt.format(new Date(session.start_time))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        HLV: {session.coach_name || "—"}
                      </div>
                    </div>
                  ))}
                  {!sessions.length && (
                    <div className="text-sm text-gray-500">
                      Chưa có buổi học nào được tạo.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "users" && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Quản lý tài khoản</h2>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Tên</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Vai trò</th>
                      <th className="text-left p-3">Trạng thái</th>
                      <th className="text-left p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="p-3 font-medium">{user.name}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRole(user.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border"
                          >
                            {roleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          {user.is_locked ? (
                            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs">
                              Bị khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="p-3 space-x-2">
                          <button
                            onClick={() => handleLock(user.id, !user.is_locked)}
                            className="px-3 py-1.5 rounded-lg border text-xs"
                          >
                            {user.is_locked ? "Mở khóa" : "Khóa"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "coaches" && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Danh sách huấn luyện viên</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {coaches.map((coach) => (
                  <div key={coach.id} className="rounded-2xl border p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden">
                        {coach.photo_url ? (
                          <img
                            src={coach.photo_url}
                            alt={coach.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-semibold">{coach.name}</div>
                        <div className="text-sm text-gray-500">
                          {coach.email || "Chưa cập nhật"}
                        </div>
                        {coach.phone && (
                          <div className="text-sm text-gray-500">
                            ☎ {coach.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {coach.experience && (
                      <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">
                        {coach.experience}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleCoachSubmit}
                className="rounded-2xl border p-5 space-y-4"
              >
                <h3 className="text-lg font-semibold">Thêm huấn luyện viên</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    required
                    value={coachForm.name}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Tên huấn luyện viên"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <input
                    value={coachForm.email}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Email"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <input
                    value={coachForm.phone}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="Số điện thoại"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <input
                    value={coachForm.photo_url}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, photo_url: e.target.value }))
                    }
                    placeholder="Liên kết ảnh chân dung"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <textarea
                    value={coachForm.experience}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, experience: e.target.value }))
                    }
                    placeholder="Kinh nghiệm, thành tích"
                    className="md:col-span-2 px-3 py-2 rounded-xl border min-h-[120px]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                >
                  Lưu huấn luyện viên
                </button>
              </form>
            </section>
          )}

          {activeTab === "classes" && (
            <section className="space-y-6">
              <h2 className="text-xl font-semibold">Danh sách lớp học</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {classes.map((clazz) => (
                  <div key={clazz.id} className="rounded-2xl border overflow-hidden">
                    <div className="h-40 bg-gray-100">
                      {clazz.image_url ? (
                        <img
                          src={clazz.image_url}
                          alt={clazz.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{clazz.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                          Sức chứa: {clazz.class_capacity ?? "—"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        HLV: {clazz.coach_name || "—"}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {clazz.description || "Chưa có mô tả."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleClassSubmit}
                className="rounded-2xl border p-5 space-y-4"
              >
                <h3 className="text-lg font-semibold">Tạo lớp học mới</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    required
                    value={classForm.title}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Tên lớp"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <select
                    required
                    value={classForm.coach_id}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, coach_id: e.target.value }))
                    }
                    className="px-3 py-2 rounded-xl border"
                  >
                    <option value="">Chọn huấn luyện viên</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={classForm.location_id}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, location_id: e.target.value }))
                    }
                    className="px-3 py-2 rounded-xl border"
                  >
                    <option value="">Chọn địa điểm</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={classForm.capacity}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, capacity: e.target.value }))
                    }
                    placeholder="Sức chứa"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <select
                    value={classForm.level_id}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, level_id: e.target.value }))
                    }
                    className="px-3 py-2 rounded-xl border"
                  >
                    <option value="">Chọn trình độ</option>
                    {levels.map((lv) => (
                      <option key={lv.id} value={lv.id}>
                        {lv.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={classForm.category_id}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, category_id: e.target.value }))
                    }
                    className="px-3 py-2 rounded-xl border"
                  >
                    <option value="">Chọn thể loại</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={classForm.image_url}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, image_url: e.target.value }))
                    }
                    placeholder="Liên kết ảnh lớp học"
                    className="md:col-span-2 px-3 py-2 rounded-xl border"
                  />
                  <textarea
                    value={classForm.description}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Mô tả khóa học"
                    className="md:col-span-2 px-3 py-2 rounded-xl border min-h-[120px]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                >
                  Tạo lớp học
                </button>
              </form>
            </section>
          )}

          {activeTab === "sessions" && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Các buổi học</h2>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Lớp</th>
                      <th className="text-left p-3">Thời gian</th>
                      <th className="text-left p-3">Huấn luyện viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-t">
                        <td className="p-3">{session.class_title}</td>
                        <td className="p-3">
                          {dateFmt.format(new Date(session.start_time))}
                        </td>
                        <td className="p-3">{session.coach_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "locations" && (
            <section className="space-y-6">
              <h2 className="text-xl font-semibold">Địa điểm tập luyện</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {locations.map((loc) => (
                  <div key={loc.id} className="rounded-2xl border p-5">
                    <div className="font-semibold">{loc.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {loc.address || "Chưa cập nhật địa chỉ"}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleLocationSubmit}
                className="rounded-2xl border p-5 space-y-4"
              >
                <h3 className="text-lg font-semibold">Thêm địa điểm</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    required
                    value={locationForm.name}
                    onChange={(e) =>
                      setLocationForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Tên địa điểm"
                    className="px-3 py-2 rounded-xl border"
                  />
                  <input
                    value={locationForm.address}
                    onChange={(e) =>
                      setLocationForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="Địa chỉ"
                    className="px-3 py-2 rounded-xl border"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                >
                  Lưu địa điểm
                </button>
              </form>
            </section>
          )}

          {activeTab === "enrollments" && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Đăng ký gần đây</h2>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Học viên</th>
                      <th className="text-left p-3">Lớp học</th>
                      <th className="text-left p-3">Trạng thái</th>
                      <th className="text-left p-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((en) => (
                      <tr key={en.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{en.user_name}</div>
                          <div className="text-xs text-gray-500">{en.user_email}</div>
                        </td>
                        <td className="p-3">{en.class_title}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs">
                            {en.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {en.start_time
                            ? dateFmt.format(new Date(en.start_time))
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "reports" && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Thống kê &amp; báo cáo</h2>
                <div className="flex gap-2">
                  <select
                    value={summaryFilter}
                    onChange={(e) => setSummaryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border text-sm"
                  >
                    <option value="class">Theo lớp học</option>
                    <option value="coach">Theo huấn luyện viên</option>
                    <option value="location">Theo địa điểm</option>
                  </select>
                  <a
                    href={`/api/reports/export.csv?by=${summaryFilter}`}
                    className="px-4 py-2 rounded-xl border text-sm"
                  >
                    Xuất CSV
                  </a>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Tên</th>
                      <th className="text-left p-3">Số lượt đăng ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">
                          {row.title || row.name || `Mục ${idx + 1}`}
                        </td>
                        <td className="p-3">{row.enrolls}</td>
                      </tr>
                    ))}
                    {!summary.length && (
                      <tr>
                        <td className="p-4 text-sm text-gray-500" colSpan={2}>
                          Chưa có dữ liệu thống kê.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
