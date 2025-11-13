import * as sessionsModel from "../models/sessionsModel.js";
import { pool } from "../db.js";
import { ensureSessionBookingsTable } from "../utils/schema.js";
import { push as pushNotification } from "./notificationsController.js";

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

/**
 * GET /api/sessions/class/:classId
 */
export async function listSessionsByClass(req, res) {
  try {
    const classId = Number(req.params.classId);
    if (!classId) {
      return res
        .status(400)
        .json({ ok: false, message: "classId is required" });
    }
    const data = await sessionsModel.getSessionsByClass(classId);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error("listSessionsByClass error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * POST /api/sessions
 * Body tối thiểu: class_id, start_time, end_time
 */
export async function createSession(req, res) {
  try {
    const { class_id, start_time, end_time } = req.body || {};
    if (!class_id || !start_time || !end_time) {
      return res.status(400).json({
        ok: false,
        message: "class_id, start_time, end_time are required",
      });
    }
    // Model nên trả { id: insertId }
    const { id } = await sessionsModel.createSession(req.body);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * PUT /api/sessions/:id
 * Body: 1+ fields trong allowFields
 */
export async function updateSession(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res.status(400).json({ ok: false, message: "id is required" });

    const payload = req.body || {};
    const allowFields = ["class_id", "start_time", "end_time", "capacity"];
    const hasAny = allowFields.some((k) =>
      Object.prototype.hasOwnProperty.call(payload, k)
    );
    if (!hasAny) {
      return res
        .status(400)
        .json({ ok: false, message: "No fields to update" });
    }

    const affected = await sessionsModel.updateSession(id, payload);
    if (!affected) {
      return res.status(404).json({ ok: false, message: "Session not found" });
    }
    return res.json({ ok: true, affected });
  } catch (err) {
    console.error("updateSession error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteSession(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res.status(400).json({ ok: false, message: "id is required" });

    // 1) Chặn xóa nếu còn enrollments tham chiếu
    const hasRefs = await sessionsModel.hasActiveEnrollments(id);
    if (hasRefs) {
      return res.status(409).json({
        ok: false,
        message:
          "Cannot delete: session has enrollments. Cancel them first or use cascade.",
      });
    }

    // 2) Thực hiện xóa
    const affected = await sessionsModel.deleteSession(id);
    if (!affected) {
      return res.status(404).json({ ok: false, message: "Session not found" });
    }

    return res.status(204).end();
  } catch (err) {
    // 3) Ánh xạ mọi lỗi ràng buộc FK về 409 (tùy RDBMS/driver)
    const fkCodes = new Set([
      1451, // MySQL: ER_ROW_IS_REFERENCED_2
      "ER_ROW_IS_REFERENCED_2",
      "ER_ROW_IS_REFERENCED",
      "SQLITE_CONSTRAINT_FOREIGNKEY", // nếu lỡ chạy SQLite trong local
    ]);
    if (fkCodes.has(err?.errno) || fkCodes.has(err?.code)) {
      return res.status(409).json({
        ok: false,
        message: "Cannot delete: referenced by other records",
      });
    }

    console.error("deleteSession error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function notifyParticipants(req, res) {
  const { id } = req.params; // id = session_id

  try {
    // 1. Lấy session và thông tin lớp để hiển thị trong thông báo
    const [[sessionRow]] = await pool.query(
      `SELECT s.id, s.class_id, s.start_time, c.title AS class_title
       FROM sessions s
       JOIN classes c ON c.id = s.class_id
       WHERE s.id = ?`,
      [id]
    );
    if (!sessionRow) {
      return res
        .status(404)
        .json({ ok: false, message: "Không tìm thấy buổi học" });
    }

    // 2. Lấy danh sách học viên đã đăng ký lớp này
    const [rows] = await pool.query(
      `
        SELECT u.id, u.name
        FROM enrollments e
        JOIN users u ON u.id = e.user_id
        WHERE e.class_id = ?
          AND e.status IN ('PAID', 'PENDING_PAYMENT', 'WAITLIST')
      `,
      [sessionRow.class_id]
    );

    if (!rows.length) {
      return res.json({
        ok: true,
        sent: 0,
        message: "Không có học viên nào để gửi thông báo",
      });
    }

    // 3. Tạo thông báo cho từng học viên
    const startTimeLabel = formatDateTime(sessionRow.start_time);
    const notificationTitle = sessionRow.class_title
      ? `Lớp ${sessionRow.class_title}`
      : "Nhắc nhở buổi học";
    const notificationBody = `Huấn luyện viên vừa gửi nhắc nhở cho buổi học lúc ${startTimeLabel}. Hãy kiểm tra lịch và chuẩn bị tham gia!`;

    await Promise.all(
      rows.map((user) =>
        pushNotification(user.id, notificationTitle, notificationBody)
      )
    );

    return res.json({
      ok: true,
      sent: rows.length,
      message: `Đã tạo thông báo cho ${rows.length} học viên`,
    });
  } catch (err) {
    console.error("notifyParticipants error:", err);
    return res.status(500).json({
      ok: false,
      message: "Lỗi gửi thông báo",
      error: err.message,
    });
  }
}

export async function registerForSession(req, res) {
  const sessionId = Number(req.params.id);
  if (!sessionId)
    return res.status(400).json({ ok: false, message: "Buổi học không hợp lệ" });

  const userId = req.user.id;
  const conn = await pool.getConnection();

  try {
    await ensureSessionBookingsTable();
    await conn.beginTransaction();

    const [[sessionRow]] = await conn.query(
      `SELECT s.id, s.class_id, s.start_time, s.end_time, s.capacity, c.title AS class_title
         FROM sessions s
         JOIN classes c ON c.id = s.class_id
        WHERE s.id = ?
        FOR UPDATE`,
      [sessionId]
    );

    if (!sessionRow) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Không tìm thấy buổi học" });
    }

    const [[classEnrollment]] = await conn.query(
      `SELECT id, status
         FROM enrollments
        WHERE user_id=? AND class_id=?
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [userId, sessionRow.class_id]
    );

    if (!classEnrollment || classEnrollment.status !== "PAID") {
      await conn.rollback();
      return res.status(400).json({
        ok: false,
        message: "Hãy hoàn tất thanh toán khóa học trước khi đăng ký buổi học.",
      });
    }

    const [[existing]] = await conn.query(
      `SELECT id, status
         FROM session_bookings
        WHERE session_id=? AND user_id=?
        FOR UPDATE`,
      [sessionId, userId]
    );

    if (existing?.status === "BOOKED") {
      await conn.rollback();
      return res
        .status(409)
        .json({ ok: false, message: "Bạn đã đăng ký buổi học này" });
    }

    if (sessionRow.start_time) {
      const [sameDay] = await conn.query(
        `SELECT sb.session_id
           FROM session_bookings sb
           JOIN sessions s ON s.id = sb.session_id
          WHERE sb.user_id=?
            AND DATE(s.start_time) = DATE(?)
            AND sb.status = 'BOOKED'
          FOR UPDATE`,
        [userId, sessionRow.start_time]
      );

      const conflict = sameDay.find(
        (row) => Number(row.session_id) !== Number(sessionId)
      );
      if (conflict) {
        await conn.rollback();
        return res.status(409).json({
          ok: false,
          message: "Bạn đã đăng ký một buổi khác trong ngày này.",
        });
      }
    }

    if (sessionRow.capacity != null) {
      const [[countRow]] = await conn.query(
        `SELECT COUNT(*) AS cnt
           FROM session_bookings
          WHERE session_id=?
            AND status='BOOKED'
          FOR UPDATE`,
        [sessionId]
      );
      if (Number(countRow.cnt || 0) >= Number(sessionRow.capacity || 0)) {
        await conn.rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Buổi học đã đủ chỗ" });
      }
    }

    if (existing) {
      await conn.query(
        `UPDATE session_bookings SET status='BOOKED', updated_at=NOW() WHERE id=?`,
        [existing.id]
      );
    } else {
      await conn.query(
        `INSERT INTO session_bookings (session_id, class_id, user_id, status)
         VALUES (?, ?, ?, 'BOOKED')`,
        [sessionId, sessionRow.class_id, userId]
      );
    }

    await conn.commit();

    const startLabel = formatDateTime(sessionRow.start_time);
    try {
      await pushNotification(
        userId,
        sessionRow.class_title
          ? `Đăng ký buổi học: ${sessionRow.class_title}`
          : "Đăng ký buổi học",
        `Bạn đã đăng ký thành công buổi học diễn ra vào ${startLabel}. Hẹn gặp bạn trên sân!`
      );
    } catch (notifyErr) {
      console.error("registerForSession pushNotification", notifyErr);
    }

    return res.json({
      ok: true,
      message: "Đăng ký buổi học thành công",
      data: { session_id: sessionId },
    });
  } catch (err) {
    await conn.rollback();
    console.error("registerForSession error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}

export async function mySessionBookingsByClass(req, res) {
  const classId = Number(req.params.classId);
  if (!classId)
    return res.status(400).json({ ok: false, message: "Class không hợp lệ" });

  try {
    await ensureSessionBookingsTable();
    const [rows] = await pool.query(
      `SELECT sb.session_id, sb.status, sb.created_at
         FROM session_bookings sb
         JOIN sessions s ON s.id = sb.session_id
        WHERE sb.user_id = ? AND s.class_id = ?
        ORDER BY s.start_time ASC`,
      [req.user.id, classId]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("mySessionBookingsByClass error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
