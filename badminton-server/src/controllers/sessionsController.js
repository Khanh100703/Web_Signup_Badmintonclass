import dayjs from "dayjs";
import "dayjs/locale/vi.js";
import * as sessionsModel from "../models/sessionsModel.js";
import { findCoachByUserId } from "../models/coachesModel.js";
import { sendMail } from "../services/mailService.js";
import { push as pushNotification } from "./notificationsController.js";

dayjs.locale("vi");

export async function listSessions(req, res) {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await sessionsModel.listUpcomingSessions(limit);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error("listSessions error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
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

export async function notifySession(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "id is required" });
    }

    const session = await sessionsModel.getSessionWithClass(id);
    if (!session) {
      return res.status(404).json({ ok: false, message: "Session not found" });
    }

    if (req.user.role === "COACH") {
      const coach = await findCoachByUserId(req.user.id);
      if (!coach || coach.id !== session.coach_id) {
        return res
          .status(403)
          .json({ ok: false, message: "Không có quyền gửi thông báo" });
      }
    }

    const students = await sessionsModel.listEnrolledUsers(id);
    if (!students.length) {
      return res.json({
        ok: true,
        sent: 0,
        message: "Không có học viên nào đã đăng ký buổi học này.",
      });
    }

    const startAt = dayjs(session.start_time).format("dddd, DD/MM/YYYY HH:mm");
    const endAt = session.end_time
      ? dayjs(session.end_time).format("HH:mm")
      : null;
    const location = session.location_name
      ? `${session.location_name}${
          session.location_address ? ` – ${session.location_address}` : ""
        }`
      : "Sân tập";

    const subject = `Nhắc lịch buổi học ${session.class_title}`;
    const baseText = `Xin chào,

Đây là email nhắc lịch cho buổi học "${session.class_title}".
- Thời gian: ${startAt}${endAt ? ` đến ${endAt}` : ""}
- Địa điểm: ${location}

Vui lòng đến lớp đúng giờ và chuẩn bị dụng cụ cần thiết.

Hẹn gặp bạn trên sân!`;

    let success = 0;
    const promises = students.map(async (stu) => {
      try {
        const text = baseText.replace(
          "Xin chào,",
          `Xin chào ${stu.name || "học viên"},`
        );
        await sendMail({
          to: stu.email,
          subject,
          text,
          html: text.replace(/\n/g, "<br />"),
        });
        await pushNotification(
          stu.id,
          subject,
          `Buổi học diễn ra lúc ${startAt}. Địa điểm: ${location}.`
        );
        success += 1;
      } catch (mailErr) {
        console.error("notifySession send error:", mailErr);
      }
    });

    await Promise.all(promises);

    return res.json({
      ok: true,
      sent: success,
      message: `Đã gửi email nhắc lịch cho ${success}/${students.length} học viên.`,
    });
  } catch (err) {
    console.error("notifySession error:", err);
    return res.status(500).json({ ok: false, message: "Gửi thông báo thất bại" });
  }
}
