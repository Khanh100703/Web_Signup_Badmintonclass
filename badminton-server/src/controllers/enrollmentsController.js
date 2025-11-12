import { pool } from "../db.js";
import { validationResult } from "express-validator";
import { sendMail } from "../utils/mailer.js";

// Không cho đăng ký/huỷ khi còn dưới X giờ trước giờ bắt đầu (buổi đầu tiên)
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
  const { class_id, note = null } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Lớp có tồn tại & đang mở không?
    const [[klass]] = await conn.query(
      `SELECT id, capacity, status FROM classes WHERE id=? FOR UPDATE`,
      [class_id]
    );
    if (!klass) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "Class not found" });
    }
    if (!["UPCOMING", "ONGOING"].includes(klass.status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Class is not open for enrollment" });
    }

    // 2) Đã có đăng ký trước đó chưa? (unique class_id + user_id)
    const [dup] = await conn.query(
      `SELECT id, status FROM enrollments WHERE class_id=? AND user_id=?`,
      [class_id, userId]
    );
    if (dup.length) {
      await conn.rollback();
      return res
        .status(409)
        .json({ ok: false, message: "You already enrolled this class" });
    }

    // 3) Check capacity (đếm PENDING_PAYMENT + PAID)
    const [[countRow]] = await conn.query(
      `SELECT COUNT(*) AS cnt
         FROM enrollments
        WHERE class_id=? AND status IN ('PENDING_PAYMENT','PAID')`,
      [class_id]
    );
    if (countRow.cnt >= (klass.capacity ?? 0)) {
      await conn.rollback();
      return res.status(409).json({ ok: false, message: "Class is full" });
    }

    // 4) Tạo enrollment ở trạng thái chờ thanh toán
    const [ins] = await conn.query(
      `INSERT INTO enrollments (user_id, class_id, status, note)
       VALUES (?, ?, 'PENDING_PAYMENT', ?)`,
      [userId, class_id, note]
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
          ? `${info.location_name}${
              info.location_address ? ` – ${info.location_address}` : ""
            }`
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

/**
 * DELETE /api/enrollments/:id
 * Huỷ theo ID bản ghi enrollment (chủ sở hữu mới được huỷ).
 * Chỉ cho huỷ nếu còn ≥ MIN_HOURS_BEFORE so với giờ bắt đầu của BUỔI ĐẦU TIÊN của lớp.
 */
export async function cancelEnrollmentById(req, res) {
  const userId = req.user.id;
  const id = Number(req.params.id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Lấy enrollment + thông tin lớp
    const [[row]] = await conn.query(
      `SELECT e.id, e.user_id, e.status, e.class_id,
              c.start_date, c.status AS class_status
         FROM enrollments e
         JOIN classes c ON c.id = e.class_id
        WHERE e.id = ? FOR UPDATE`,
      [id]
    );
    if (!row) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });
    }
    if (row.user_id !== userId) {
      await conn.rollback();
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (row.status !== "PENDING_PAYMENT" && row.status !== "PAID") {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "Cannot cancel" });
    }

    // 2) Kiểm tra thời gian: so với BUỔI ĐẦU TIÊN của class
    const [[firstSession]] = await conn.query(
      `SELECT start_time
         FROM sessions
        WHERE class_id = ?
        ORDER BY start_time ASC
        LIMIT 1`,
      [row.class_id]
    );
    if (firstSession?.start_time) {
      const now = new Date();
      const startAt = new Date(firstSession.start_time);
      const hoursUntil = (startAt - now) / (1000 * 60 * 60);
      if (hoursUntil <= 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({ ok: false, message: "Class already started" });
      }
      if (hoursUntil < MIN_HOURS_BEFORE) {
        await conn.rollback();
        return res.status(400).json({
          ok: false,
          message: `Cannot cancel within ${MIN_HOURS_BEFORE} hours before start`,
        });
      }
    }

    // 3) Huỷ
    await conn.query(`UPDATE enrollments SET status='CANCELLED' WHERE id=?`, [
      id,
    ]);

    await conn.commit();
    return res.json({ ok: true, message: "Cancelled" });
  } catch (err) {
    await conn.rollback();
    console.error("cancelEnrollmentById error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
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
    return res
      .status(400)
      .json({ ok: false, message: "Invalid enrollment id" });

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
