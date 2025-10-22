import pool from "../db.js";

export async function mark(req, res) {
  const { items } = req.body; // [{enrollment_id, status, note}]
  if (!Array.isArray(items) || !items.length)
    return res.status(400).json({ ok: false, message: "No items" });

  const values = items.map((it) => [
    it.enrollment_id,
    it.status,
    it.note || null,
  ]);
  await pool.query(
    "INSERT INTO attendance(enrollment_id,status,note) VALUES ? " +
      "ON DUPLICATE KEY UPDATE status=VALUES(status), note=VALUES(note)",
    [values]
  );
  res.json({ ok: true });
}
export async function list(req, res) {
  const { sessionId } = req.params;
  const [rows] = await pool.query(
    `SELECT a.enrollment_id, a.status, a.note, e.user_id
FROM attendance a JOIN enrollments e ON e.id=a.enrollment_id
WHERE e.session_id=?`,
    [sessionId]
  );
  res.json({ ok: true, data: rows });
}
