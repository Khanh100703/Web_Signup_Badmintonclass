import * as usersModel from "../models/usersModel.js";
import * as enrollmentsModel from "../models/enrollmentsModel.js";
import { sanitizeUser } from "./authController.js";

export async function getMe(req, res) {
  try {
    const user = await usersModel.findUserById(req.user.id);
    res.json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateMe(req, res) {
  try {
    const { full_name, phone } = req.body;
    await usersModel.updateUserProfile(req.user.id, { full_name, phone });
    const updated = await usersModel.findUserById(req.user.id);
    res.json({ ok: true, data: sanitizeUser(updated) });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMySchedule(req, res) {
  try {
    const rows = await enrollmentsModel.listScheduleByUser(req.user.id);
    const now = Date.now();
    const data = rows
      .map((item) => {
        const start = item.start_time ? new Date(item.start_time).getTime() : null;
        const end = item.end_time ? new Date(item.end_time).getTime() : null;
        let status = "Upcoming";
        if (item.enrollment_status === "CANCELLED") {
          status = "Cancelled";
        } else if (end && now > end) {
          status = "Completed";
        }
        return {
          enrollment_id: item.enrollment_id,
          session_id: item.session_id,
          class_id: item.class_id,
          class_title: item.class_title,
          coach_name: item.coach_name,
          location_name: item.location_name,
          start_time: item.start_time,
          end_time: item.end_time,
          status,
        };
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    res.json({ ok: true, data });
  } catch (err) {
    console.error("getMySchedule error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
