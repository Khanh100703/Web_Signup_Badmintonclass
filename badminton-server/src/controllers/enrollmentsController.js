import { pool } from "../db.js";
import { validationResult } from "express-validator";

// Mặc định không cho đăng ký hoặc huỷ khi còn dưới 2 giờ trước giờ bắt đầu
const MIN_HOURS_BEFORE = 2;

export async function enroll(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const userId = req.user.id;
  const { session_id } = req.body;

  try {
    // 0) ĐÃ ĐĂNG KÝ/WAITLIST CHƯA?
    const [[existed]] = await pool.query(
      `SELECT id, status FROM enrollments 
       WHERE user_id=? AND session_id=? AND status IN ('ENROLLED','WAITLIST')`,
      [userId, session_id]
    );
    if (existed) {
      return res.status(200).json({
        ok: true,
        already: true,
        message:
          existed.status === "ENROLLED"
            ? "Bạn đã đăng ký buổi này"
            : "Bạn đang trong danh sách chờ",
      });
    }

    // 1) Lấy thông tin session + class
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

    // 2) Kiểm tra thời gian (rule 2h)
    const now = new Date();
    const startAt = new Date(s.start_time);
    const hoursUntil = (startAt - now) / (1000 * 60 * 60);
    if (hoursUntil <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: "Buổi học đã bắt đầu/qua rồi" });
    }
    if (hoursUntil < MIN_HOURS_BEFORE) {
      return res.status(400).json({
        ok: false,
        message: `Không thể đăng ký khi còn < ${MIN_HOURS_BEFORE} giờ trước khi bắt đầu`,
      });
    }

    // 3) Tính capacity
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM enrollments WHERE session_id=? AND status='ENROLLED'`,
      [session_id]
    );
    const enrolledCount = countRow.cnt;
    const capacity = s.session_capacity ?? s.class_capacity ?? 0;

    if (capacity > 0 && enrolledCount >= capacity) {
      await pool.query(
        `INSERT INTO enrollments (session_id, user_id, status)
         VALUES (?,?, 'WAITLIST')
         ON DUPLICATE KEY UPDATE status='WAITLIST'`,
        [session_id, userId]
      );
      return res.json({
        ok: true,
        waitlisted: true,
        message: "Lớp đã đầy, bạn được thêm vào danh sách chờ.",
      });
    }

    await pool.query(
      `INSERT INTO enrollments (session_id, user_id, status)
       VALUES (?,?, 'ENROLLED')
       ON DUPLICATE KEY UPDATE status='ENROLLED'`,
      [session_id, userId]
    );

    return res
      .status(201)
      .json({ ok: true, enrolled: true, message: "Đăng ký thành công!" });
  } catch (e) {
    console.error("enroll error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function cancelEnrollment(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const [[row]] = await pool.query(
      `SELECT e.id, e.user_id, e.session_id, s.start_time
       FROM enrollments e
       JOIN sessions s ON s.id = e.session_id
       WHERE e.id=?`,
      [id]
    );
    if (!row)
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });

    if (row.user_id !== userId) {
      return res.status(403).json({ ok: false, message: "Không có quyền huỷ" });
    }

    const now2 = new Date();
    const startAt2 = new Date(row.start_time);
    const hoursUntil2 = (startAt2 - now2) / (1000 * 60 * 60);
    if (hoursUntil2 <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: "Buổi học đã bắt đầu/qua rồi" });
    }
    if (hoursUntil2 < MIN_HOURS_BEFORE) {
      return res.status(400).json({
        ok: false,
        message: `Không thể huỷ khi còn < ${MIN_HOURS_BEFORE} giờ trước khi bắt đầu`,
      });
    }

    await pool.query('UPDATE enrollments SET status="CANCELLED" WHERE id=?', [
      id,
    ]);

    // Promote từ WAITLIST nếu còn chỗ
    const [[cap]] = await pool.query(
      "SELECT capacity FROM sessions WHERE id=?",
      [row.session_id]
    );
    if (cap) {
      const [[cnt]] = await pool.query(
        `SELECT COUNT(*) AS n FROM enrollments WHERE session_id=? AND status='ENROLLED'`,
        [row.session_id]
      );

      if (cnt.n < cap.capacity) {
        const [[next]] = await pool.query(
          `SELECT id, user_id FROM enrollments
           WHERE session_id=? AND status='WAITLIST'
           ORDER BY created_at ASC LIMIT 1`,
          [row.session_id]
        );

        if (next) {
          await pool.query(
            'UPDATE enrollments SET status="ENROLLED" WHERE id=?',
            [next.id]
          );
        }
      }
    }

    return res.json({ ok: true, message: "Đã huỷ đăng ký" });
  } catch (e) {
    console.error("cancelEnrollment error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// NEW: danh sách session_id user đã đăng ký (ENROLLED/WAITLIST) trong 1 class
export async function myByClass(req, res) {
  const userId = req.user.id;
  const classId = req.query.class_id;
  if (!classId)
    return res.status(400).json({ ok: false, message: "Missing class_id" });

  try {
    const [rows] = await pool.query(
      `SELECT e.session_id
       FROM enrollments e
       JOIN sessions s ON s.id = e.session_id
       WHERE e.user_id=? AND s.class_id=? AND e.status IN ('ENROLLED','WAITLIST')`,
      [userId, classId]
    );
    return res.json({ ok: true, session_ids: rows.map((r) => r.session_id) });
  } catch (e) {
    console.error("myByClass error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function adminList(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.status, e.created_at,
              u.name AS user_name, u.email AS user_email,
              s.start_time, s.end_time,
              c.title AS class_title
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       JOIN sessions s ON s.id = e.session_id
       JOIN classes c ON c.id = s.class_id
       ORDER BY e.created_at DESC
       LIMIT 200`
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("adminList enrollments error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
