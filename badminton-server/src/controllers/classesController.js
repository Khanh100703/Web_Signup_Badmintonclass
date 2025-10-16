import * as classesModel from "../models/classesModel.js";

export async function listClasses(req, res) {
  try {
    const { level, coach_id, location_id, q } = req.query;
    const data = await classesModel.getAllClasses({
      level,
      coach_id,
      location_id,
      q,
    });
    res.json({ ok: true, data });
  } catch (err) {
    console.error("listClasses error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getClassDetail(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "Class id is required" });
    }
    const klass = await classesModel.getClassById(id);
    if (!klass) {
      return res.status(404).json({ ok: false, message: "Class not found" });
    }
    const sessions = await classesModel.getUpcomingSessionsForClass(id);
    const data = {
      ...klass,
      sessions: sessions.map((session) => {
        const capacity = session.capacity ?? klass.capacity ?? 0;
        const available_slots = Math.max(capacity - session.active_enrolled, 0);
        return {
          ...session,
          capacity,
          available_slots,
        };
      }),
    };
    res.json({ ok: true, data });
  } catch (err) {
    console.error("getClassDetail error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createClass(req, res) {
  try {
    const { title, coach_id } = req.body;
    if (!title || !coach_id) {
      return res
        .status(400)
        .json({ ok: false, message: "title & coach_id are required" });
    }
    const { id } = await classesModel.createClass(req.body);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("createClass error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
