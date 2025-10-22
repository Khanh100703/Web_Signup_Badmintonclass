import { pool } from "../db.js";

export async function mySchedule(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
         e.id AS enrollment_id,
         s.id AS session_id, s.start_time, s.end_time,
         c.title AS class_title, c.coach_id,
         CASE 
           WHEN e.status='CANCELLED' THEN 'Cancelled'
           WHEN s.start_time > NOW() THEN 'Upcoming'
           WHEN s.end_time < NOW() THEN 'Completed'
           ELSE 'Ongoing'
         END AS status
       FROM enrollments e
       JOIN sessions s ON s.id = e.session_id
       JOIN classes c  ON c.id = s.class_id
       WHERE e.user_id=? 
       ORDER BY s.start_time DESC`,
      [req.user.id]
    );
    res.json({ ok: true, data: rows });
  } catch {
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
