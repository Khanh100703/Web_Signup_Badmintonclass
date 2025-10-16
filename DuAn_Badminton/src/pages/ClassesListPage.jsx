import { useEffect, useMemo, useState } from "react";
import ClassCard from "../components/ClassCard.jsx";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import { classesApi, coachesApi } from "../api/index.js";

function buildOptions(items, idKey, labelKey) {
  const map = new Map();
  items.forEach((item) => {
    const id = item[idKey];
    const label = item[labelKey];
    if (id && label && !map.has(id)) {
      map.set(id, label);
    }
  });
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

export default function ClassesListPage() {
  const [filters, setFilters] = useState({ q: "", level: "", coach_id: "", location_id: "" });
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [classResponse, coachResponse] = await Promise.all([
          classesApi.list(),
          coachesApi.list(),
        ]);
        setClasses(classResponse.data ?? []);
        setAllClasses(classResponse.data ?? []);
        setCoaches(coachResponse.data ?? []);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách lớp học");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadFiltered() {
      setError("");
      setLoading(true);
      try {
        const response = await classesApi.list(filters);
        setClasses(response.data ?? []);
      } catch (err) {
        setError(err.message || "Không thể lọc lớp học");
      } finally {
        setLoading(false);
      }
    }
    loadFiltered();
  }, [filters.q, filters.level, filters.coach_id, filters.location_id]);

  const levelOptions = useMemo(
    () => buildOptions(allClasses, "level_id", "level_name"),
    [allClasses]
  );
  const locationOptions = useMemo(
    () => buildOptions(allClasses, "location_id", "location_name"),
    [allClasses]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ q: "", level: "", coach_id: "", location_id: "" });
  };

  return (
    <div className="classes-page">
      <HeroBanner
        title="Lớp cầu lông cho nhân viên văn phòng TP.HCM"
        subtitle="Lịch học linh hoạt, sân chuẩn thi đấu và huấn luyện viên tận tâm giúp bạn nâng cao kỹ năng mỗi tuần."
        actions={
          <button className="btn primary" onClick={resetFilters} type="button">
            Xem tất cả lớp
          </button>
        }
      />
      <section className="container section">
        <div className="filters">
          <div className="form-group">
            <label htmlFor="search">Từ khóa</label>
            <input
              id="search"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Tìm theo tên lớp, trình độ..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="level">Trình độ</label>
            <select id="level" name="level" value={filters.level} onChange={handleFilterChange}>
              <option value="">Tất cả</option>
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="coach">Huấn luyện viên</label>
            <select
              id="coach"
              name="coach_id"
              value={filters.coach_id}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="location">Khu vực sân</label>
            <select
              id="location"
              name="location_id"
              value={filters.location_id}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả</option>
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FeedbackMessage type="error" message={error} onClose={() => setError("")} />
        {loading ? (
          <div className="page-loading">
            <div className="spinner" />
            <p>Đang tải lớp học...</p>
          </div>
        ) : classes.length ? (
          <div className="classes-grid">
            {classes.map((klass) => (
              <ClassCard key={klass.id} klass={klass} />
            ))}
          </div>
        ) : (
          <p className="empty-state">Không tìm thấy lớp học phù hợp.</p>
        )}
      </section>
    </div>
  );
}
