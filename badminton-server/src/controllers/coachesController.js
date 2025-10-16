import * as coachesModel from "../models/coachesModel.js";

export async function listCoaches(req, res) {
  try {
    const data = await coachesModel.listCoaches();
    res.json({ ok: true, data });
  } catch (err) {
    console.error("listCoaches error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
