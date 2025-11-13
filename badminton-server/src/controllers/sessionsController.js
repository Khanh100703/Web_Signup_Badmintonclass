import * as sessionsModel from "../models/sessionsModel.js";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";

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
    // 1. Lấy session để biết nó thuộc class nào
    const [[sessionRow]] = await pool.query(
      "SELECT id, class_id FROM sessions WHERE id = ?",
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
        SELECT u.email, u.name
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

    // 3. Gửi email (tuỳ hệ thống mail bạn dùng)
    for (const user of rows) {
      await sendEmail(
        user.email,
        "Nhắc nhở buổi học sắp tới",
        `Xin chào ${user.name},\n\nBạn có một buổi học sắp diễn ra.\nVui lòng kiểm tra lịch của bạn.`
      );
    }

    return res.json({
      ok: true,
      sent: rows.length,
      message: `Đã gửi email tới ${rows.length} học viên`,
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
