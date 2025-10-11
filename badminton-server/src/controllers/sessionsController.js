import * as sessionsModel from "../models/sessionsModel.js";

export async function listSessionsByClass(req, res) {
  try {
    const classId = Number(req.params.classId);
    if (!classId)
      return res
        .status(400)
        .json({ ok: false, message: "classId is required" });
    const data = await sessionsModel.getSessionsByClass(classId);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("listSessionsByClass error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createSession(req, res) {
  try {
    const { class_id, start_time, end_time } = req.body;
    if (!class_id || !start_time || !end_time) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "class_id, start_time, end_time are required",
        });
    }
    const { id_sessions } = await sessionsModel.createSession(req.body);
    res.status(201).json({ ok: true, id_sessions });
  } catch (err) {
    console.error("createSession error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
