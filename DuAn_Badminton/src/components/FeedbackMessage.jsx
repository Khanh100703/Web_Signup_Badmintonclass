export default function FeedbackMessage({ type = "info", message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert ${type}`} role="status">
      <span>{message}</span>
      {onClose && (
        <button type="button" className="link" onClick={onClose}>
          Đóng
        </button>
      )}
    </div>
  );
}
