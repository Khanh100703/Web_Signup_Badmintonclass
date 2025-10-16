import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import { classesApi, enrollmentApi } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value) {
  if (!value) return "";
  return dateTimeFormatter.format(new Date(value));
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await classesApi.getDetail(id);
        setDetail(response.data);
      } catch (err) {
        setError(err.message || "Không thể tải thông tin lớp học");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const upcomingSessions = useMemo(
    () => detail?.sessions ?? [],
    [detail]
  );

  const handleEnroll = async (sessionId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/classes/${id}` } } });
      return;
    }
    setMessage("");
    setError("");
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(sessionId);
      setMessageType("success");
      setMessage("Đăng ký thành công! Hẹn gặp bạn trên sân.");
      // refresh detail to update slots
      const response = await classesApi.getDetail(id);
      setDetail(response.data);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Không thể đăng ký buổi học");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Đang tải lớp học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        <FeedbackMessage type="error" message={error} onClose={() => setError("")} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container section">
        <p className="empty-state">Không tìm thấy lớp học.</p>
      </div>
    );
  }

  return (
    <div className="class-detail container section">
      <div className="class-detail-header">
        <div>
          <h1>{detail.title}</h1>
          {detail.level_name && <span className="badge level">{detail.level_name}</span>}
          {detail.location_name && (
            <span className="badge location">{detail.location_name}</span>
          )}
        </div>
        <div className="class-detail-info">
          {detail.coach_name && (
            <p>
              <strong>Huấn luyện viên:</strong> {detail.coach_name}
            </p>
          )}
          {detail.coach_experience_years && (
            <p>
              <strong>Kinh nghiệm:</strong> {detail.coach_experience_years} năm
            </p>
          )}
          {detail.capacity && (
            <p>
              <strong>Sức chứa lớp:</strong> {detail.capacity} học viên
            </p>
          )}
        </div>
      </div>
      {detail.description && (
        <div className="class-detail-description">
          <h3>Nội dung khóa học</h3>
          <p>{detail.description}</p>
        </div>
      )}
      <FeedbackMessage
        type={messageType}
        message={message}
        onClose={() => setMessage("")}
      />
      <section className="sessions-section">
        <h2>Lịch học sắp tới</h2>
        {upcomingSessions.length ? (
          <div className="sessions-grid">
            {upcomingSessions.map((session) => {
              const isFull = (session.available_slots ?? 0) <= 0;
              return (
                <div className="session-card" key={session.id}>
                  <div>
                    <h4>{formatDateTime(session.start_time)}</h4>
                    <p className="session-time">
                      {formatDateTime(session.end_time)}
                    </p>
                    <p>
                      <strong>Còn lại:</strong> {session.available_slots} chỗ
                    </p>
                  </div>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={isFull || enrolling}
                    onClick={() => handleEnroll(session.id)}
                  >
                    {isFull ? "Đã đầy" : "Đăng ký ngay"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">Hiện chưa có lịch học sắp tới.</p>
        )}
      </section>
    </div>
  );
}
