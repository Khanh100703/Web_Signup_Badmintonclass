import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

/** Helper: chấp nhận nhiều kiểu response (mảng trực tiếp, {ok,data}, {data:[…]}) */
function toArray(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}
const fmtDT = (v) =>
  v ? new Date(v).toLocaleString("vi-VN", { hour12: false }) : "—";
const toDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const toDTLocal = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
const fromDTLocal = (v) => (v ? new Date(v).toISOString() : null);

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "users", label: "Tài khoản" },
  { key: "coaches", label: "Huấn luyện viên" },
  { key: "classes", label: "Lớp học" },
  { key: "sessions", label: "Buổi học" },
  { key: "locations", label: "Địa điểm" },
  { key: "enrollments", label: "Đăng ký" },
  { key: "reports", label: "Báo cáo" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  // ===== Users =====
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // ===== Coaches =====
  const [coaches, setCoaches] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [coachForm, setCoachForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    photo_url: "",
  });
  const [coachEdit, setCoachEdit] = useState(null);

  // ===== Locations =====
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locForm, setLocForm] = useState({
    name: "",
    address: "",
    capacity: "",
    notes: "",
  });
  const [locEdit, setLocEdit] = useState(null);

  // ===== Levels/Categories (danh mục chọn) =====
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState([]);

  // ===== Classes =====
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classForm, setClassForm] = useState({
    title: "",
    coach_id: "",
    location_id: "",
    level_id: "",
    category_id: "",
    capacity: "",
    price: "",
    image_url: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [classEditId, setClassEditId] = useState(null);
  const [classEdit, setClassEdit] = useState(null);

  // ===== Sessions =====
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectClassId, setSelectClassId] = useState("");
  const [sesForm, setSesForm] = useState({
    start_time: "",
    end_time: "",
    capacity: "",
  });
  const [sesEditId, setSesEditId] = useState(null);
  const [sesEdit, setSesEdit] = useState(null);

  // ===== Enrollments =====
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // ===== Reports =====
  const [report, setReport] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return {
      from: toDate(from.toISOString()),
      to: toDate(to.toISOString()),
      by: "class",
    };
  });

  // ===== Initial loads =====
  useEffect(() => {
    loadUsers();
    loadCoaches();
    loadLocations();
    loadLevels();
    loadCategories();
    loadClasses();
  }, []);
  useEffect(() => {
    if (classes.length && !selectClassId)
      setSelectClassId(String(classes[0].id));
  }, [classes, selectClassId]);
  useEffect(() => {
    if (selectClassId) loadSessions(selectClassId);
  }, [selectClassId]);
  useEffect(() => {
    if (tab === "enrollments" || tab === "overview") loadEnrollments();
  }, [tab]);
  useEffect(() => {
    if (tab === "reports") loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reportFilter]);

  // ===== API loaders =====
  async function loadUsers() {
    setUsersLoading(true);
    try {
      setUsers(toArray(await api.get("/api/admin/users")));
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }
  async function loadCoaches() {
    setCoachesLoading(true);
    try {
      setCoaches(toArray(await api.get("/api/coaches")));
    } catch (e) {
      console.error(e);
    } finally {
      setCoachesLoading(false);
    }
  }
  async function loadLocations() {
    setLocLoading(true);
    try {
      setLocations(toArray(await api.get("/api/locations")));
    } catch (e) {
      console.error(e);
    } finally {
      setLocLoading(false);
    }
  }
  async function loadLevels() {
    try {
      setLevels(toArray(await api.get("/api/levels")));
    } catch (e) {
      console.error(e);
    }
  }
  async function loadCategories() {
    try {
      setCategories(toArray(await api.get("/api/categories")));
    } catch (e) {
      console.error(e);
    }
  }
  async function loadClasses() {
    setClassesLoading(true);
    try {
      setClasses(toArray(await api.get("/api/classes")));
    } catch (e) {
      console.error(e);
    } finally {
      setClassesLoading(false);
    }
  }
  async function loadSessions(classId) {
    setSessionsLoading(true);
    try {
      setSessions(toArray(await api.get(`/api/sessions/class/${classId}`)));
    } catch (e) {
      console.error(e);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }
  async function loadEnrollments() {
    setEnrollLoading(true);
    try {
      setEnrollments(toArray(await api.get("/api/enrollments")));
    } catch (e) {
      console.error(e);
    } finally {
      setEnrollLoading(false);
    }
  }

  async function loadReport() {
    setReportLoading(true);
    try {
      const q = new URLSearchParams(reportFilter).toString();
      setReport(toArray(await api.get(`/api/reports/summary?${q}`)));
    } catch (e) {
      console.error(e);
      setReport([]);
    } finally {
      setReportLoading(false);
    }
  }

  // ===== Users actions =====
  async function toggleUserLock(u) {
    try {
      await api.patch(
        `/api/admin/users/${u.id}/${u.is_locked ? "unlock" : "lock"}`
      );
      loadUsers();
    } catch (e) {
      alert(e?.message || "Không cập nhật được trạng thái");
    }
  }
  async function changeUserRole(id, role) {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      loadUsers();
    } catch (e) {
      alert(e?.message || "Không đổi được vai trò");
    }
  }

  // ===== Coaches actions =====
  async function submitCoach(e) {
    e.preventDefault();
    try {
      await api.post("/api/coaches", coachForm);
      setCoachForm({
        name: "",
        email: "",
        phone: "",
        experience: "",
        photo_url: "",
      });
      loadCoaches();
    } catch (e) {
      alert(e?.message || "Không tạo được HLV");
    }
  }
  function startEditCoach(c) {
    setCoachEdit({ ...c });
  }
  async function saveCoach() {
    try {
      await api.put(`/api/coaches/${coachEdit.id}`, coachEdit);
      setCoachEdit(null);
      loadCoaches();
    } catch (e) {
      alert(e?.message || "Không cập nhật HLV");
    }
  }
  async function removeCoach(id) {
    if (!window.confirm("Xoá huấn luyện viên này?")) return;
    try {
      await api.del(`/api/coaches/${id}`);
      loadCoaches();
    } catch (e) {
      alert(e?.message || "Không xoá được HLV");
    }
  }

  // ===== Locations actions =====
  async function submitLocation(e) {
    e.preventDefault();
    try {
      const payload = {
        name: locForm.name,
        address: locForm.address || null,
        capacity: locForm.capacity ? Number(locForm.capacity) : null,
        notes: locForm.notes || null,
      };
      await api.post("/api/locations", payload);
      setLocForm({ name: "", address: "", capacity: "", notes: "" });
      loadLocations();
    } catch (e) {
      alert(e?.message || "Không tạo được địa điểm");
    }
  }
  async function saveLocation() {
    try {
      const payload = {
        ...locEdit,
        capacity: locEdit.capacity ? Number(locEdit.capacity) : null,
      };
      await api.put(`/api/locations/${locEdit.id}`, payload);
      setLocEdit(null);
      loadLocations();
    } catch (e) {
      alert(e?.message || "Không cập nhật địa điểm");
    }
  }
  async function removeLocation(id) {
    if (!window.confirm("Xoá địa điểm này?")) return;
    try {
      await api.del(`/api/locations/${id}`);
      loadLocations();
    } catch (e) {
      alert(e?.message || "Không xoá được địa điểm");
    }
  }

  // ===== Classes actions =====
  async function submitClass(e) {
    e.preventDefault();
    try {
      const payload = {
        title: classForm.title,
        coach_id: classForm.coach_id ? Number(classForm.coach_id) : null,
        location_id: classForm.location_id
          ? Number(classForm.location_id)
          : null,
        level_id: classForm.level_id ? Number(classForm.level_id) : null,
        category_id: classForm.category_id
          ? Number(classForm.category_id)
          : null,
        capacity: classForm.capacity ? Number(classForm.capacity) : null,
        price: classForm.price ? Number(classForm.price) : 0,
        image_url: classForm.image_url || null,
        start_date: classForm.start_date || null,
        end_date: classForm.end_date || null,
        description: classForm.description || null,
      };
      await api.post("/api/classes", payload);
      setClassForm({
        title: "",
        coach_id: "",
        location_id: "",
        level_id: "",
        category_id: "",
        capacity: "",
        price: "",
        image_url: "",
        start_date: "",
        end_date: "",
        description: "",
      });
      loadClasses();
    } catch (e) {
      alert(e?.message || "Không tạo được lớp");
    }
  }
  function startEditClass(c) {
    setClassEditId(c.id);
    setClassEdit({
      id: c.id,
      title: c.title || "",
      coach_id: c.coach_id || "",
      location_id: c.location_id || "",
      level_id: c.level_id || "",
      category_id: c.category_id || "",
      capacity: c.capacity || "",
      price: c.price || "",
      image_url: c.image_url || "",
      start_date: toDate(c.start_date) || "",
      end_date: toDate(c.end_date) || "",
      description: c.description || "",
    });
  }
  async function saveClass() {
    try {
      const payload = {
        title: classEdit.title,
        coach_id: classEdit.coach_id ? Number(classEdit.coach_id) : null,
        location_id: classEdit.location_id
          ? Number(classEdit.location_id)
          : null,
        level_id: classEdit.level_id ? Number(classEdit.level_id) : null,
        category_id: classEdit.category_id
          ? Number(classEdit.category_id)
          : null,
        capacity: classEdit.capacity ? Number(classEdit.capacity) : null,
        price: classEdit.price ? Number(classEdit.price) : 0,
        image_url: classEdit.image_url || null,
        start_date: classEdit.start_date || null,
        end_date: classEdit.end_date || null,
        description: classEdit.description || null,
      };
      await api.put(`/api/classes/${classEditId}`, payload);
      setClassEditId(null);
      setClassEdit(null);
      loadClasses();
    } catch (e) {
      alert(e?.message || "Không cập nhật lớp");
    }
  }
  async function removeClass(id) {
    if (!window.confirm("Xoá lớp học này?")) return;
    try {
      await api.del(`/api/classes/${id}`);
      loadClasses();
    } catch (e) {
      alert(e?.message || "Không xoá được lớp (có thể lớp vẫn còn buổi)");
    }
  }

  // ===== Sessions actions =====
  async function submitSession(e) {
    e.preventDefault();
    if (!selectClassId) return;
    try {
      const payload = {
        class_id: Number(selectClassId),
        start_time: fromDTLocal(sesForm.start_time),
        end_time: fromDTLocal(sesForm.end_time),
        capacity: sesForm.capacity ? Number(sesForm.capacity) : null,
      };
      await api.post("/api/sessions", payload);
      setSesForm({ start_time: "", end_time: "", capacity: "" });
      loadSessions(selectClassId);
    } catch (e) {
      alert(e?.message || "Không tạo được buổi học");
    }
  }
  function startEditSession(s) {
    setSesEditId(s.id);
    setSesEdit({
      start_time: toDTLocal(s.start_time) || "",
      end_time: toDTLocal(s.end_time) || "",
      capacity: s.capacity || "",
    });
  }
  async function saveSession() {
    try {
      const payload = {
        start_time: fromDTLocal(sesEdit.start_time),
        end_time: fromDTLocal(sesEdit.end_time),
        capacity: sesEdit.capacity ? Number(sesEdit.capacity) : null,
      };
      await api.put(`/api/sessions/${sesEditId}`, payload);
      setSesEditId(null);
      setSesEdit(null);
      loadSessions(selectClassId);
    } catch (e) {
      alert(e?.message || "Không cập nhật buổi học");
    }
  }
  async function removeSession(id) {
    if (!window.confirm("Xoá buổi học này?")) return;
    try {
      await api.del(`/api/sessions/${id}`);
      loadSessions(selectClassId);
    } catch (e) {
      alert(e?.message || "Không xoá được buổi");
    }
  }
  async function notifySession(id) {
    try {
      const res = await api.post(`/api/sessions/${id}/notify`);
      alert(
        res?.message ||
          (res?.ok ? "Đã gửi thông báo" : "Gửi thông báo thất bại")
      );
    } catch (e) {
      alert(e?.message || "Không gửi được thông báo");
    }
  }

  // ===== Enrollments actions =====
  async function updateEnrollStatus(id, status) {
    try {
      await api.patch(`/api/enrollments/${id}/status`, { status });
      loadEnrollments();
    } catch (e) {
      alert(e?.message || "Không cập nhật trạng thái đăng ký");
    }
  }

  // ===== Overview stats =====
  const overview = useMemo(() => {
    const activeStudents = new Set(
      enrollments
        .filter((e) =>
          ["PAID", "PENDING_PAYMENT", "WAITLIST"].includes(e.status)
        )
        .map((e) => e.user_id)
    ).size;
    return [
      { label: "Khóa học", value: classes.length },
      { label: "Huấn luyện viên", value: coaches.length },
      { label: "Địa điểm", value: locations.length },
      { label: "Học viên đang tham gia", value: activeStudents },
    ];
  }, [classes, coaches, locations, enrollments]);

  // ===== Renderers =====
  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.map((s) => (
          <div key={s.label} className="rounded-2xl border p-6 bg-white">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="mt-2 text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Tài khoản</h2>
      {usersLoading ? (
        <div className="p-6">Đang tải…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
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
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 text-gray-600">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeUserRole(u.id, e.target.value)}
                      className="border rounded-lg px-2 py-1"
                    >
                      <option value="USER">USER</option>
                      <option value="COACH">COACH</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {u.is_locked ? (
                      <span className="text-red-600">Đã khoá</span>
                    ) : (
                      <span className="text-green-600">Hoạt động</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleUserLock(u)}
                      className="px-3 py-1.5 rounded-xl border"
                    >
                      {u.is_locked ? "Mở khoá" : "Khoá"}
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={5}>
                    Chưa có tài khoản.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCoaches = () => (
    <div className="space-y-10">
      {/* form */}
      <form
        onSubmit={submitCoach}
        className="grid md:grid-cols-2 gap-4 rounded-2xl border p-6 bg-white"
      >
        <div className="space-y-2">
          <label className="block text-sm font-semibold">Tên</label>
          <input
            required
            value={coachForm.name}
            onChange={(e) =>
              setCoachForm((v) => ({ ...v, name: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold">Email</label>
          <input
            type="email"
            value={coachForm.email}
            onChange={(e) =>
              setCoachForm((v) => ({ ...v, email: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold">SĐT</label>
          <input
            value={coachForm.phone}
            onChange={(e) =>
              setCoachForm((v) => ({ ...v, phone: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold">Ảnh (URL)</label>
          <input
            value={coachForm.photo_url}
            onChange={(e) =>
              setCoachForm((v) => ({ ...v, photo_url: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold">Kinh nghiệm</label>
          <textarea
            value={coachForm.experience}
            onChange={(e) =>
              setCoachForm((v) => ({ ...v, experience: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button className="px-4 py-2 rounded-xl bg-black text-white">
            Thêm HLV
          </button>
        </div>
      </form>

      {/* list */}
      <div className="space-y-4">
        {coachesLoading ? (
          <div className="p-6">Đang tải…</div>
        ) : (
          coaches.map((c) => (
            <div key={c.id} className="rounded-2xl border p-5 bg-white">
              {coachEdit?.id === c.id ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={coachEdit.name}
                    onChange={(e) =>
                      setCoachEdit((v) => ({ ...v, name: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={coachEdit.email || ""}
                    onChange={(e) =>
                      setCoachEdit((v) => ({ ...v, email: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={coachEdit.phone || ""}
                    onChange={(e) =>
                      setCoachEdit((v) => ({ ...v, phone: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={coachEdit.photo_url || ""}
                    onChange={(e) =>
                      setCoachEdit((v) => ({ ...v, photo_url: e.target.value }))
                    }
                  />
                  <textarea
                    className="md:col-span-2 border rounded-xl px-3 py-2"
                    value={coachEdit.experience || ""}
                    onChange={(e) =>
                      setCoachEdit((v) => ({
                        ...v,
                        experience: e.target.value,
                      }))
                    }
                  />
                  <div className="md:col-span-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setCoachEdit(null)}
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
                    <div className="text-lg font-semibold">{c.name}</div>
                    <div className="text-sm text-gray-600">
                      {c.email || "(chưa có email)"} •{" "}
                      {c.phone || "(chưa có SĐT)"}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                      {c.experience || "Chưa có mô tả"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEditCoach(c)}
                      className="px-3 py-2 rounded-xl border"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => removeCoach(c.id)}
                      className="px-3 py-2 rounded-xl border text-red-600"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {!coaches.length && !coachesLoading && (
          <div className="rounded-2xl border p-6 text-center text-gray-500">
            Chưa có HLV.
          </div>
        )}
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-10">
      {/* form */}
      <form
        onSubmit={submitClass}
        className="grid lg:grid-cols-2 gap-4 rounded-2xl border p-6 bg-white"
      >
        <div className="lg:col-span-2 space-y-2">
          <label className="text-sm font-semibold">Tên lớp</label>
          <input
            required
            value={classForm.title}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, title: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">HLV</label>
          <select
            required
            value={classForm.coach_id}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, coach_id: e.target.value }))
            }
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
          <label className="text-sm font-semibold">Địa điểm</label>
          <select
            value={classForm.location_id}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, location_id: e.target.value }))
            }
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
          <label className="text-sm font-semibold">Trình độ</label>
          <select
            value={classForm.level_id}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, level_id: e.target.value }))
            }
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
          <label className="text-sm font-semibold">Danh mục</label>
          <select
            value={classForm.category_id}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, category_id: e.target.value }))
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
          <label className="text-sm font-semibold">Sức chứa</label>
          <input
            type="number"
            value={classForm.capacity}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, capacity: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Học phí</label>
          <input
            type="number"
            value={classForm.price}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, price: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Ảnh</label>
          <input
            value={classForm.image_url}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, image_url: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Bắt đầu</label>
          <input
            type="date"
            value={classForm.start_date}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, start_date: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Kết thúc</label>
          <input
            type="date"
            value={classForm.end_date}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, end_date: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="lg:col-span-2 space-y-2">
          <label className="text-sm font-semibold">Mô tả</label>
          <textarea
            value={classForm.description}
            onChange={(e) =>
              setClassForm((v) => ({ ...v, description: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
          />
        </div>
        <div className="lg:col-span-2 flex justify-end">
          <button className="px-4 py-2 rounded-xl bg-black text-white">
            Tạo lớp
          </button>
        </div>
      </form>

      {/* list */}
      <div className="space-y-4">
        {classesLoading ? (
          <div className="p-6">Đang tải…</div>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="rounded-2xl border p-5 bg-white">
              {classEditId === c.id ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={classEdit.title}
                    onChange={(e) =>
                      setClassEdit((v) => ({ ...v, title: e.target.value }))
                    }
                  />
                  <select
                    className="border rounded-xl px-3 py-2"
                    value={classEdit.coach_id}
                    onChange={(e) =>
                      setClassEdit((v) => ({ ...v, coach_id: e.target.value }))
                    }
                  >
                    <option value="">-- Chọn HLV --</option>
                    {coaches.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded-xl px-3 py-2"
                    value={classEdit.location_id}
                    onChange={(e) =>
                      setClassEdit((v) => ({
                        ...v,
                        location_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Chọn địa điểm --</option>
                    {locations.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="border rounded-xl px-3 py-2"
                    type="number"
                    value={classEdit.capacity}
                    onChange={(e) =>
                      setClassEdit((v) => ({ ...v, capacity: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    type="number"
                    value={classEdit.price}
                    onChange={(e) =>
                      setClassEdit((v) => ({ ...v, price: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={classEdit.image_url || ""}
                    onChange={(e) =>
                      setClassEdit((v) => ({ ...v, image_url: e.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="border rounded-xl px-3 py-2"
                    value={classEdit.start_date || ""}
                    onChange={(e) =>
                      setClassEdit((v) => ({
                        ...v,
                        start_date: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    className="border rounded-xl px-3 py-2"
                    value={classEdit.end_date || ""}
                    onChange={(e) =>
                      setClassEdit((v) => ({ ...v, end_date: e.target.value }))
                    }
                  />
                  <textarea
                    className="md:col-span-2 border rounded-xl px-3 py-2"
                    value={classEdit.description || ""}
                    onChange={(e) =>
                      setClassEdit((v) => ({
                        ...v,
                        description: e.target.value,
                      }))
                    }
                  />
                  <div className="md:col-span-2 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setClassEditId(null);
                        setClassEdit(null);
                      }}
                      className="px-4 py-2 rounded-xl border"
                    >
                      Huỷ
                    </button>
                    <button
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
                    <div className="text-lg font-semibold">{c.title}</div>
                    <div className="text-sm text-gray-500">
                      HLV: {c.coach_name || "—"} • Sức chứa: {c.capacity ?? "—"}{" "}
                      • Giá: {c.price ?? "—"}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {c.description || "Chưa có mô tả"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEditClass(c)}
                      className="px-3 py-2 rounded-xl border"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => removeClass(c.id)}
                      className="px-3 py-2 rounded-xl border text-red-600"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {!classes.length && !classesLoading && (
          <div className="rounded-2xl border p-6 text-center text-gray-500">
            Chưa có lớp.
          </div>
        )}
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Buổi học</h2>
        <select
          value={selectClassId}
          onChange={(e) => setSelectClassId(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* form */}
      <form
        onSubmit={submitSession}
        className="grid md:grid-cols-4 gap-4 rounded-2xl border p-6 bg-white"
      >
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold">Bắt đầu</label>
          <input
            type="datetime-local"
            required
            value={sesForm.start_time}
            onChange={(e) =>
              setSesForm((v) => ({ ...v, start_time: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold">Kết thúc</label>
          <input
            type="datetime-local"
            required
            value={sesForm.end_time}
            onChange={(e) =>
              setSesForm((v) => ({ ...v, end_time: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Sức chứa</label>
          <input
            type="number"
            value={sesForm.capacity}
            onChange={(e) =>
              setSesForm((v) => ({ ...v, capacity: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button className="px-4 py-2 rounded-xl bg-black text-white">
            Tạo buổi học
          </button>
        </div>
      </form>

      {/* list */}
      <div className="rounded-2xl border overflow-hidden bg-white">
        {sessionsLoading ? (
          <div className="p-6">Đang tải…</div>
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
              {sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">
                    {sesEditId === s.id ? (
                      <input
                        type="datetime-local"
                        value={sesEdit.start_time}
                        onChange={(e) =>
                          setSesEdit((v) => ({
                            ...v,
                            start_time: e.target.value,
                          }))
                        }
                        className="border rounded-xl px-3 py-2"
                      />
                    ) : (
                      fmtDT(s.start_time)
                    )}
                  </td>
                  <td className="p-3">
                    {sesEditId === s.id ? (
                      <input
                        type="datetime-local"
                        value={sesEdit.end_time}
                        onChange={(e) =>
                          setSesEdit((v) => ({
                            ...v,
                            end_time: e.target.value,
                          }))
                        }
                        className="border rounded-xl px-3 py-2"
                      />
                    ) : (
                      fmtDT(s.end_time)
                    )}
                  </td>
                  <td className="p-3">
                    {sesEditId === s.id ? (
                      <input
                        type="number"
                        value={sesEdit.capacity}
                        onChange={(e) =>
                          setSesEdit((v) => ({
                            ...v,
                            capacity: e.target.value,
                          }))
                        }
                        className="border rounded-xl px-3 py-2 w-24"
                      />
                    ) : (
                      s.capacity ?? "—"
                    )}
                  </td>
                  <td className="p-3 flex flex-wrap gap-2">
                    {sesEditId === s.id ? (
                      <>
                        <button
                          onClick={saveSession}
                          className="px-3 py-1.5 rounded-xl border bg-black text-white"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => {
                            setSesEditId(null);
                            setSesEdit(null);
                          }}
                          className="px-3 py-1.5 rounded-xl border"
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditSession(s)}
                          className="px-3 py-1.5 rounded-xl border"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => notifySession(s.id)}
                          className="px-3 py-1.5 rounded-xl border"
                        >
                          Gửi email nhắc
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => removeSession(s.id)}
                      className="px-3 py-1.5 rounded-xl border text-red-600"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {!sessions.length && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={4}>
                    Chưa có buổi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-10">
      {/* form */}
      <form
        onSubmit={submitLocation}
        className="grid md:grid-cols-2 gap-4 rounded-2xl border p-6 bg-white"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold">Tên địa điểm</label>
          <input
            required
            value={locForm.name}
            onChange={(e) =>
              setLocForm((v) => ({ ...v, name: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Địa chỉ</label>
          <input
            value={locForm.address}
            onChange={(e) =>
              setLocForm((v) => ({ ...v, address: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Sức chứa</label>
          <input
            type="number"
            value={locForm.capacity}
            onChange={(e) =>
              setLocForm((v) => ({ ...v, capacity: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold">Ghi chú</label>
          <textarea
            value={locForm.notes}
            onChange={(e) =>
              setLocForm((v) => ({ ...v, notes: e.target.value }))
            }
            className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button className="px-4 py-2 rounded-xl bg-black text-white">
            Thêm địa điểm
          </button>
        </div>
      </form>

      {/* list */}
      <div className="space-y-4">
        {locLoading ? (
          <div className="p-6">Đang tải…</div>
        ) : (
          locations.map((l) => (
            <div key={l.id} className="rounded-2xl border p-5 bg-white">
              {locEdit?.id === l.id ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={locEdit.name}
                    onChange={(e) =>
                      setLocEdit((v) => ({ ...v, name: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    value={locEdit.address || ""}
                    onChange={(e) =>
                      setLocEdit((v) => ({ ...v, address: e.target.value }))
                    }
                  />
                  <input
                    className="border rounded-xl px-3 py-2"
                    type="number"
                    value={locEdit.capacity || ""}
                    onChange={(e) =>
                      setLocEdit((v) => ({ ...v, capacity: e.target.value }))
                    }
                  />
                  <textarea
                    className="md:col-span-2 border rounded-xl px-3 py-2"
                    value={locEdit.notes || ""}
                    onChange={(e) =>
                      setLocEdit((v) => ({ ...v, notes: e.target.value }))
                    }
                  />
                  <div className="md:col-span-2 flex justify-end gap-3">
                    <button
                      onClick={() => setLocEdit(null)}
                      className="px-4 py-2 rounded-xl border"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={saveLocation}
                      className="px-4 py-2 rounded-xl bg-black text-white"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">{l.name}</div>
                    <div className="text-sm text-gray-600">
                      {l.address || "—"} • Sức chứa: {l.capacity ?? "—"}
                    </div>
                    {l.notes && (
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                        {l.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLocEdit(l)}
                      className="px-3 py-2 rounded-xl border"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => removeLocation(l.id)}
                      className="px-3 py-2 rounded-xl border text-red-600"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {!locations.length && !locLoading && (
          <div className="rounded-2xl border p-6 text-center text-gray-500">
            Chưa có địa điểm.
          </div>
        )}
      </div>
    </div>
  );

  const renderEnrollments = () => (
    <div className="rounded-2xl border overflow-hidden bg-white">
      {enrollLoading ? (
        <div className="p-6">Đang tải…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Mã</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Lớp</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-left">Ngày tạo</th>
              <th className="p-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.id}</td>
                <td className="p-3">{e.user_name || e.user_id}</td>
                <td className="p-3">{e.class_title || e.class_id}</td>
                <td className="p-3">{e.status}</td>
                <td className="p-3">{fmtDT(e.created_at)}</td>
                <td className="p-3">
                  <select
                    value={e.status}
                    onChange={(ev) => updateEnrollStatus(e.id, ev.target.value)}
                    className="border rounded-lg px-2 py-1"
                  >
                    <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="WAITLIST">WAITLIST</option>
                  </select>
                </td>
              </tr>
            ))}
            {!enrollments.length && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  Chưa có đăng ký.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-sm font-semibold">Từ ngày</div>
          <input
            type="date"
            value={reportFilter.from}
            onChange={(e) =>
              setReportFilter((v) => ({ ...v, from: e.target.value }))
            }
            className="border rounded-xl px-3 py-2"
          />
        </div>
        <div>
          <div className="text-sm font-semibold">Đến ngày</div>
          <input
            type="date"
            value={reportFilter.to}
            onChange={(e) =>
              setReportFilter((v) => ({ ...v, to: e.target.value }))
            }
            className="border rounded-xl px-3 py-2"
          />
        </div>
        <div>
          <div className="text-sm font-semibold">Theo</div>
          <select
            value={reportFilter.by}
            onChange={(e) =>
              setReportFilter((v) => ({ ...v, by: e.target.value }))
            }
            className="border rounded-xl px-3 py-2"
          >
            <option value="class">Lớp</option>
            <option value="coach">HLV</option>
            <option value="day">Ngày</option>
          </select>
        </div>
        <button onClick={loadReport} className="px-4 py-2 rounded-xl border">
          Làm mới
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white">
        {reportLoading ? (
          <div className="p-6">Đang tải…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {report.length ? (
                  Object.keys(report[0]).map((k) => (
                    <th key={k} className="p-3 text-left">
                      {k}
                    </th>
                  ))
                ) : (
                  <th className="p-3 text-left">Kết quả</th>
                )}
              </tr>
            </thead>
            <tbody>
              {report.length ? (
                report.map((r, i) => (
                  <tr key={i} className="border-t">
                    {Object.keys(r).map((k) => (
                      <td key={k} className="p-3">
                        {String(r[k])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-6 text-gray-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
      <div className="max-w-7xl mx-auto space-y-8 rounded-3xl bg-white/95 px-4 py-8 shadow-xl sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">
              Admin Control
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Bảng điều khiển Admin
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg"
                  : "border border-blue-100 bg-white text-slate-600 hover:border-emerald-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && renderOverview()}
        {tab === "users" && renderUsers()}
        {tab === "coaches" && renderCoaches()}
        {tab === "classes" && renderClasses()}
        {tab === "sessions" && renderSessions()}
        {tab === "locations" && renderLocations()}
        {tab === "enrollments" && renderEnrollments()}
        {tab === "reports" && renderReports()}
      </div>
    </div>
  );
}
