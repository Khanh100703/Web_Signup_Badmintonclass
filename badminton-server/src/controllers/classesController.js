import { pool } from "../db.js";
import * as classesModel from "../models/classesModel.js";

/**
 * GET /api/classes
 * Hỗ trợ filter: level_id, coach_id, location_id, q
 */
export async function listClasses(req, res) {
  try {
    const data = await classesModel.getClasses({
      level_id: req.query.level_id,
      coach_id: req.query.coach_id,
      location_id: req.query.location_id,
      q: req.query.q,
    });
    return res.json({ ok: true, data });
  } catch (e) {
    console.error("listClasses error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * GET /api/classes/:id
 * Trả kèm thông tin coach (và location nếu có)
 */
export async function getClassDetail(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
          c.*,
          co.id      AS coach_id,
          co.name    AS coach_name,
          co.email   AS coach_email,
          co.phone   AS coach_phone,
          co.photo_url AS coach_photo_url,
          l.id       AS location_id,
          l.name     AS location_name,
          l.address  AS location_address,
          lv.id      AS level_id,
          lv.name    AS level_name,
          cat.id     AS category_id,
          cat.name   AS category_name
       FROM classes c
       LEFT JOIN coaches         co  ON co.id  = c.coach_id
       LEFT JOIN locations       l   ON l.id   = c.location_id
       LEFT JOIN class_levels    lv  ON lv.id  = c.level_id
       LEFT JOIN class_categories cat ON cat.id = c.category_id
       WHERE c.id=?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }

    const c = rows[0];
    const data = {
      id: c.id,
      title: c.title,
      description: c.description,
      capacity: c.capacity ?? null,
      price: c.price ?? c.tuition ?? null, // 👈 thêm price/tuition
      coach_id: c.coach_id || null, // 👈 thêm id để frontend fallback call coach
      location_id: c.location_id || null, // 👈 thêm id để frontend fallback call location
      level_id: c.level_id || null,
      category_id: c.category_id || null,
      image_url: c.image_url || null,
      start_date: c.start_date || null,
      end_date: c.end_date || null,
      coach: c.coach_id
        ? {
            id: c.coach_id,
            name: c.coach_name,
            email: c.coach_email,
            phone: c.coach_phone,
            photo_url: c.coach_photo_url,
          }
        : null,
      location: c.location_id
        ? {
            id: c.location_id,
            name: c.location_name,
            address: c.location_address,
          }
        : null,
      level: c.level_id ? { id: c.level_id, name: c.level_name } : null,
      category: c.category_id
        ? { id: c.category_id, name: c.category_name }
        : null,
    };

    return res.json({ ok: true, data });
  } catch (e) {
    console.error("getClassDetail error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * POST /api/classes
 * Body tối thiểu: title, coach_id
 */
export async function createClass(req, res) {
  try {
    const id = await classesModel.createClass(req.body);
    const data = await classesModel.getClassDetail(Number(id));
    return res.status(201).json({ ok: true, data });
  } catch (e) {
    console.error("createClass error:", e);
    return res.status(500).json({ ok: false, message: "Create failed" });
  }
}

/**
 * PUT /api/classes/:id
 * Body: 1+ fields trong allowFields
 */
export async function updateClass(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "id is required" });
    }

    const payload = req.body || {};
    const allowFields = [
      "title",
      "description",
      "capacity",
      "coach_id",
      "location_id",
      "level_id",
      "category_id",
      "image_url",
      "start_date",
      "end_date",
      "price",
      "tuition",
      "level",
    ];
    const hasAny = allowFields.some((k) =>
      Object.prototype.hasOwnProperty.call(payload, k)
    );
    if (!hasAny) {
      return res
        .status(400)
        .json({ ok: false, message: "No fields to update" });
    }

    const affected = await classesModel.updateClass(id, payload);
    if (!affected) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }
    const data = await classesModel.getClassDetail(id);
    return res.json({ ok: true, data });
  } catch (e) {
    console.error("updateClass error:", e);
    return res.status(500).json({ ok: false, message: "Update failed" });
  }
}

/**
 * DELETE /api/classes/:id
 */
export async function deleteClass(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "id is required" });
    }

    // 1) Kiểm tra class có tồn tại không
    const exists = await classesModel.existsClassById(id);
    if (!exists) {
      return res.status(404).json({ ok: false, message: "Class not found" });
    }

    // 2) Nếu còn sessions → 409 (không cho xoá)
    const sessionsCnt = await classesModel.countSessionsOfClass(id);
    if (sessionsCnt > 0) {
      return res.status(409).json({
        ok: false,
        message: "Cannot delete class: it still has sessions",
        details: { sessions: sessionsCnt },
      });
    }

    // 3) Thực hiện xoá
    const affected = await classesModel.deleteClass(id);
    if (!affected) {
      return res.status(404).json({ ok: false, message: "Class not found" });
    }

    return res.status(204).end();
  } catch (e) {
    // 4) Ánh xạ lỗi FK về 409
    const fkCodes = new Set([
      1451, // MySQL ER_ROW_IS_REFERENCED_2
      "ER_ROW_IS_REFERENCED_2",
      "ER_ROW_IS_REFERENCED",
      "SQLITE_CONSTRAINT_FOREIGNKEY",
    ]);
    if (fkCodes.has(e?.errno) || fkCodes.has(e?.code)) {
      return res.status(409).json({
        ok: false,
        message: "Cannot delete class: referenced by other records",
      });
    }

    console.error("deleteClass error:", e);
    return res.status(500).json({ ok: false, message: "Delete failed" });
  }
}
