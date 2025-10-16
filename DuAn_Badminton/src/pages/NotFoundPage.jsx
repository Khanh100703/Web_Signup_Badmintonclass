import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container section not-found">
      <h1>404</h1>
      <p>Rất tiếc, trang bạn tìm không tồn tại.</p>
      <Link to="/" className="btn primary">
        Quay về trang chủ
      </Link>
    </div>
  );
}
