import * as categoriesModel from "../models/categoriesModel.js";

export async function listCategories(req, res) {
  try {
    const data = await categoriesModel.getAllCategories();
    return res.json({ ok: true, data });
  } catch (e) {
    console.error("listCategories error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getCategory(req, res) {
  try {
    const item = await categoriesModel.getCategoryById(Number(req.params.id));
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, data: item });
  } catch (e) {
    console.error("getCategory error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
