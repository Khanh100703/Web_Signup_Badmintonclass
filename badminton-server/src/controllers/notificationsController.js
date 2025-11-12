import { pool } from "../db.js";

export async function myList(req, res) {
  const [rows] = await pool.query(
    "SELECT id, title, body, is_read, created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json({ ok: true, data: rows });
}

export async function markRead(req, res) {
  const { ids } = req.body; // [id]
  if (Array.isArray(ids) && ids.length) {
    await pool.query(
      `UPDATE notifications SET is_read=1 WHERE user_id=? AND id IN (${ids
        .map(() => "?")
        .join(",")})`,
      [req.user.id, ...ids]
    );
  }
  res.json({ ok: true });
}

// Helper: chỉ insert 1 dòng notification
export async function push(userId, title, body) {
  await pool.query(
    "INSERT INTO notifications(user_id,title,body) VALUES(?,?,?)",
    [userId, title, body]
  );
}
