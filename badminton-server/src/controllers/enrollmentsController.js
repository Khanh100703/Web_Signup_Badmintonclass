import { pool } from "../db.js";
import { validationResult } from "express-validator";
import { sendMail } from "../utils/mailer.js";

// Mặc định không cho đăng ký hoặc huỷ khi còn dưới 2 giờ trước giờ bắt đầu
const MIN_HOURS_BEFORE = 2;

function formatDateTime(value) {
  if (!value) return "Chưa cập nhật";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

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

    let emailResult = null;
    try {
      const [[info]] = await pool.query(
        `SELECT u.email, u.name,
                c.title AS class_title,
                s.start_time, s.end_time,
                l.name AS location_name,
                l.address AS location_address
         FROM users u
         JOIN enrollments e ON e.user_id = u.id
         JOIN sessions s ON s.id = e.session_id
         JOIN classes c ON c.id = s.class_id
         LEFT JOIN locations l ON l.id = c.location_id
         WHERE e.user_id = ? AND e.session_id = ?
         ORDER BY e.id DESC
         LIMIT 1`,
        [userId, session_id]
      );

      if (info?.email) {
        const startText = formatDateTime(info.start_time);
        const endText = formatDateTime(info.end_time);
        const locationText = info.location_name
          ? `${info.location_name}${info.location_address ? ` – ${info.location_address}` : ""}`
          : "Sẽ cập nhật sau";
        const html = `
          <p>Xin chào ${info.name || "học viên"},</p>
          <p>Bạn đã đăng ký thành công buổi học <b>${info.class_title}</b>.</p>
          <p><b>Thời gian bắt đầu:</b> ${startText}</p>
          <p><b>Thời gian kết thúc:</b> ${endText}</p>
          <p><b>Địa điểm:</b> ${locationText}</p>
          <p>Vui lòng có mặt trước giờ học 10 phút để chuẩn bị. Nếu có thắc mắc, hãy liên hệ với HLV phụ trách.</p>
          <p>Hẹn gặp bạn trên sân!</p>
        `;
        emailResult = await sendMail(
          info.email,
          `Xác nhận đăng ký buổi học - ${info.class_title}`,
          html
        );
      }
    } catch (mailErr) {
      console.error("[enroll] sendMail error:", mailErr?.message || mailErr);
    }

    return res.status(201).json({
      ok: true,
      enrolled: true,
      message: "Đăng ký thành công!",
      email_sent: emailResult ? !emailResult.dev : false,
    });
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

export async function listAll(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
         e.id,
         e.status,
         e.created_at,
         s.id AS session_id,
         s.start_time,
         s.end_time,
         c.id AS class_id,
         c.title AS class_title,
         u.id AS user_id,
         u.name AS user_name,
         u.email AS user_email
       FROM enrollments e
       JOIN sessions s ON s.id = e.session_id
       JOIN classes c ON c.id = s.class_id
       JOIN users u ON u.id = e.user_id
       ORDER BY e.created_at DESC`
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("listAll enrollments error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id)
    return res.status(400).json({ ok: false, message: "Invalid enrollment id" });

  const allowed = new Set(["ENROLLED", "CANCELLED", "WAITLIST"]);
  if (!allowed.has(status))
    return res.status(400).json({ ok: false, message: "Invalid status" });

  try {
    const [result] = await pool.query(
      "UPDATE enrollments SET status=? WHERE id=?",
      [status, id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true });
  } catch (error) {
    console.error("updateStatus enrollment error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
