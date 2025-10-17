import { pool } from "../db.js";
import { validationResult } from "express-validator";

export async function enroll(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const userId = req.user.id;
  const { session_id } = req.body;

  try {
    // 1) session tồn tại?
    const [[s]] = await pool.query(
      `SELECT s.id, s.start_time, s.end_time, s.capacity AS session_capacity,
              c.capacity AS class_capacity
       FROM sessions s
       JOIN classes c ON c.id = s.class_id
       WHERE s.id = ?`,
      [session_id]
    );
    if (!s)
      return res.status(404).json({ ok: false, message: "Session not found" });

    // 2) chưa bắt đầu?
    if (new Date(s.start_time) <= new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "Buổi học đã bắt đầu/qua rồi" });
    }

    // 3) đã enroll chưa?
    const [[dup]] = await pool.query(
      `SELECT id FROM enrollments WHERE session_id=? AND user_id=? AND status='ENROLLED'`,
      [session_id, userId]
    );
    if (dup)
      return res
        .status(409)
        .json({ ok: false, message: "Bạn đã đăng ký buổi này" });

    // 4) capacity check
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM enrollments WHERE session_id=? AND status='ENROLLED'`,
      [session_id]
    );
    const enrolledCount = countRow.cnt;
    const capacity = s.session_capacity ?? s.class_capacity ?? 0;
    if (capacity > 0 && enrolledCount >= capacity) {
      return res.status(409).json({ ok: false, message: "Buổi học đã đủ chỗ" });
    }

    // 5) insert
    const [ins] = await pool.query(
      `INSERT INTO enrollments (session_id, user_id, status) VALUES (?,?, 'ENROLLED')`,
      [session_id, userId]
    );
    return res.status(201).json({ ok: true, id: ins.insertId });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function cancelEnrollment(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // lấy enrollment + session
    const [[row]] = await pool.query(
      `SELECT e.id, e.user_id, s.start_time
       FROM enrollments e
       JOIN sessions s ON s.id = e.session_id
       WHERE e.id=?`,
      [id]
    );
    if (!row)
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });
    if (row.user_id !== userId)
      return res.status(403).json({ ok: false, message: "Không có quyền huỷ" });
    if (new Date(row.start_time) <= new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "Buổi học đã bắt đầu/qua rồi" });
    }

    // Xoá hẳn để user có thể đăng ký lại (giữ UNIQUE)
    await pool.query("DELETE FROM enrollments WHERE id=?", [id]);
    return res.json({ ok: true, message: "Đã huỷ đăng ký" });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
