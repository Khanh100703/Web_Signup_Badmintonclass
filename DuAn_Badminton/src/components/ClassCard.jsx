import { Link } from "react-router-dom";

export default function ClassCard({ klass }) {
  const available = klass.available_slots ?? 0;
  return (
    <article className="class-card">
      <div className="class-card-body">
        <div className="class-meta">
          {klass.level_name && <span className="badge level">{klass.level_name}</span>}
          {klass.location_name && (
            <span className="badge location">{klass.location_name}</span>
          )}
        </div>
        <h3>{klass.title}</h3>
        {klass.description && <p className="class-desc">{klass.description}</p>}
        <div className="class-info">
          {klass.coach_name && (
            <p>
              <strong>Huấn luyện viên:</strong> {klass.coach_name}
            </p>
          )}
          <p>
            <strong>Số chỗ trống:</strong> {available}
          </p>
        </div>
      </div>
      <div className="class-card-footer">
        <Link to={`/classes/${klass.id}`} className="btn secondary">
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
