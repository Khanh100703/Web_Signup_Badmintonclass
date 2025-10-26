import * as levelsModel from "../models/levelsModel.js";

export async function listLevels(req, res) {
  try {
    const data = await levelsModel.getAllLevels();
    return res.json({ ok: true, data });
  } catch (e) {
    console.error("listLevels error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getLevel(req, res) {
  try {
    const item = await levelsModel.getLevelById(Number(req.params.id));
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, data: item });
  } catch (e) {
    console.error("getLevel error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
