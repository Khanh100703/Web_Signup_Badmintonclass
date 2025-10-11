import * as classesModel from "../models/classesModel.js";

export async function listClasses(req, res) {
  try {
    const data = await classesModel.getAllClasses();
    res.json({ ok: true, data });
  } catch (err) {
    console.error("listClasses error:", err);
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
    const { id_classes } = await classesModel.createClass(req.body);
    res.status(201).json({ ok: true, id_classes });
  } catch (err) {
    console.error("createClass error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
