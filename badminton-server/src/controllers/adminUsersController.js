import pool from "../db.js";

export async function listUsers(req, res) {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, is_locked, created_at FROM users ORDER BY created_at DESC"
  );
  res.json({ ok: true, data: rows });
}

export async function lockUser(req, res) {
  const { id } = req.params;
  await pool.query("UPDATE users SET is_locked=1 WHERE id=?", [id]);
  res.json({ ok: true });
}

export async function unlockUser(req, res) {
  const { id } = req.params;
  await pool.query("UPDATE users SET is_locked=0 WHERE id=?", [id]);
  res.json({ ok: true });
}

export async function changeRole(req, res) {
  const { id } = req.params;
  const { role } = req.body; // 'USER'|'COACH'|'ADMIN'
  if (!["USER", "COACH", "ADMIN"].includes(role))
    return res.status(400).json({ ok: false, message: "Invalid role" });
  await pool.query("UPDATE users SET role=? WHERE id=?", [role, id]);
  res.json({ ok: true });
}
