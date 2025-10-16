import { useEffect, useState } from "react";
import FeedbackMessage from "../components/FeedbackMessage.jsx";
import { enrollmentApi, scheduleApi } from "../api/index.js";

function statusClass(status) {
  switch (status) {
    case "Upcoming":
      return "badge success";
    case "Completed":
      return "badge neutral";
    case "Cancelled":
      return "badge warning";
    default:
      return "badge";
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatRange(start, end) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate) return "Chưa xác định";
  const startStr = dateTimeFormatter.format(startDate);
  if (!endDate) return startStr;
  const endStr = dateTimeFormatter.format(endDate);
  return `${startStr} - ${endStr}`;
}

export default function MySchedulePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await scheduleApi.mySchedule();
      setItems(response.data ?? []);
    } catch (err) {
      setError(err.message || "Không thể tải lịch học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleCancel = async (enrollmentId) => {
    setMessage("");
    setError("");
    try {
      await enrollmentApi.cancel(enrollmentId);
      setMessageType("success");
      setMessage("Huỷ đăng ký thành công");
      loadSchedule();
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Không thể huỷ đăng ký");
    }
  };

  return (
    <div className="container section schedule-page">
      <h1>Lịch học của tôi</h1>
      <p className="section-subtitle">
        Theo dõi lịch học đã đăng ký và chủ động sắp xếp công việc linh hoạt.
      </p>
      <FeedbackMessage
        type={message ? messageType : "error"}
        message={message || error}
        onClose={() => {
          setMessage("");
          setError("");
        }}
      />
      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
          <p>Đang tải lịch học...</p>
        </div>
      ) : items.length ? (
        <div className="schedule-list">
          {items.map((item) => (
            <article key={item.enrollment_id} className="schedule-card">
              <div>
                <h3>{item.class_title}</h3>
                <p className="schedule-time">{formatRange(item.start_time, item.end_time)}</p>
                {item.coach_name && <p>Huấn luyện viên: {item.coach_name}</p>}
                {item.location_name && <p>Địa điểm: {item.location_name}</p>}
              </div>
              <div className="schedule-meta">
                <span className={statusClass(item.status)}>{item.status}</span>
                {item.status === "Upcoming" && (
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => handleCancel(item.enrollment_id)}
                  >
                    Huỷ đăng ký
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">Bạn chưa đăng ký buổi học nào.</p>
      )}
    </div>
  );
}
