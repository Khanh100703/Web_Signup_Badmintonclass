import * as enrollmentsModel from "../models/enrollmentsModel.js";
import * as sessionsModel from "../models/sessionsModel.js";

function getMaxCapacity(session) {
  if (session.capacity != null) return Number(session.capacity);
  if (session.class_capacity != null) return Number(session.class_capacity);
  return null;
}

export async function createEnrollment(req, res) {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res
        .status(400)
        .json({ ok: false, message: "session_id là bắt buộc" });
    }
    const session = await sessionsModel.getSessionById(session_id);
    if (!session) {
      return res.status(404).json({ ok: false, message: "Buổi học không tồn tại" });
    }
    if (!session.start_time || new Date(session.start_time) <= new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "Buổi học đã bắt đầu, không thể đăng ký" });
    }

    const capacity = getMaxCapacity(session);
    try {
      const { id } = await enrollmentsModel.createEnrollment({
        userId: req.user.id,
        sessionId: session_id,
        maxCapacity: capacity,
      });
      res.status(201).json({ ok: true, id });
    } catch (err) {
      if (err.code === "DUPLICATE_ENROLLMENT") {
        return res.status(400).json({ ok: false, message: err.message });
      }
      if (err.code === "SESSION_FULL") {
        return res.status(409).json({ ok: false, message: err.message });
      }
      throw err;
    }
  } catch (err) {
    console.error("createEnrollment error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function cancelEnrollment(req, res) {
  try {
    const enrollmentId = Number(req.params.id);
    if (!enrollmentId) {
      return res.status(400).json({ ok: false, message: "ID không hợp lệ" });
    }
    const enrollment = await enrollmentsModel.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ ok: false, message: "Đăng ký không tồn tại" });
    }
    const isOwner = enrollment.user_id === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, message: "Không có quyền huỷ" });
    }
    if (enrollment.status === "CANCELLED") {
      return res.json({ ok: true });
    }
    if (!enrollment.start_time || new Date(enrollment.start_time) <= new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "Buổi học sắp diễn ra hoặc đã diễn ra" });
    }
    await enrollmentsModel.markEnrollmentCancelled(enrollmentId);
    res.json({ ok: true });
  } catch (err) {
    console.error("cancelEnrollment error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
