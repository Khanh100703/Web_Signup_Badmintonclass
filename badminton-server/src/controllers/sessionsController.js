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
  try {
    const id = Number(req.params.id);
    if (!id)
      return res.status(400).json({ ok: false, message: "id is required" });

    const [[sessionRow]] = await pool.query(
      `SELECT s.id, s.start_time, s.end_time, s.class_id,
              c.title AS class_title,
              c.coach_id,
              co.email AS coach_email,
              co.name AS coach_name,
              l.name AS location_name,
              l.address AS location_address
       FROM sessions s
       JOIN classes c ON c.id = s.class_id
       LEFT JOIN coaches co ON co.id = c.coach_id
       LEFT JOIN locations l ON l.id = c.location_id
       WHERE s.id = ?`,
      [id]
    );

    if (!sessionRow)
      return res.status(404).json({ ok: false, message: "Session not found" });

    if (req.user.role === "COACH") {
      const [[userRow]] = await pool.query(
        "SELECT email FROM users WHERE id=?",
        [req.user.id]
      );
      if (!userRow?.email)
        return res.status(403).json({ ok: false, message: "Không có quyền" });
      const coachEmail = sessionRow.coach_email?.toLowerCase();
      if (!coachEmail || coachEmail !== userRow.email.toLowerCase()) {
        return res
          .status(403)
          .json({ ok: false, message: "Không có quyền gửi thông báo" });
      }
    }

    const [students] = await pool.query(
      `SELECT u.email, u.name
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.session_id = ? AND e.status='ENROLLED'`,
      [id]
    );

    if (!students.length)
      return res.json({ ok: true, sent: 0, total: 0 });

    const startText = formatDateTime(sessionRow.start_time);
    const endText = formatDateTime(sessionRow.end_time);
    const locationText = sessionRow.location_name
      ? `${sessionRow.location_name}${sessionRow.location_address ? ` – ${sessionRow.location_address}` : ""}`
      : "Sẽ cập nhật sau";

    let sent = 0;
    let devCount = 0;
    for (const student of students) {
      if (!student.email) continue;
      const html = `
        <p>Xin chào ${student.name || "học viên"},</p>
        <p>Đây là thông báo lịch học cho lớp <b>${sessionRow.class_title}</b>.</p>
        <p><b>Thời gian bắt đầu:</b> ${startText}</p>
        <p><b>Thời gian kết thúc:</b> ${endText}</p>
        <p><b>Địa điểm:</b> ${locationText}</p>
        <p>Rất mong bạn sắp xếp thời gian và tham gia đúng giờ.</p>
      `;
      try {
        const result = await sendMail(
          student.email,
          `Nhắc lịch buổi học - ${sessionRow.class_title}`,
          html
        );
        if (result?.dev) devCount += 1;
        else sent += 1;
      } catch (mailErr) {
        console.error("notifyParticipants mail error:", mailErr);
      }
    }

    return res.json({ ok: true, sent, total: students.length, dev: devCount });
  } catch (error) {
    console.error("notifyParticipants error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
