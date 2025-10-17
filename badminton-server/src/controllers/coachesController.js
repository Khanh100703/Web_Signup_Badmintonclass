import { pool } from "../db.js";

export async function listCoaches(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT co.id, co.name, co.email, co.experience, co.avatar_url,
              (SELECT COUNT(*) FROM classes c WHERE c.coach_id = co.id) AS total_classes
       FROM coaches co
       ORDER BY co.id DESC`
    );
    return res.json({ ok: true, data: rows });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
