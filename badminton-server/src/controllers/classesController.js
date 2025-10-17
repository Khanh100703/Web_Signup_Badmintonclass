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
 */
export async function getClassDetail(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id)
      return res.status(400).json({ ok: false, message: "id is required" });

    const data = await classesModel.getClassDetail(id);
    if (!data || !data.cls) {
      return res.status(404).json({ ok: false, message: "Class not found" });
    }
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
    if (!id)
      return res.status(400).json({ ok: false, message: "id is required" });

    const payload = req.body || {};
    const allowFields = [
      "title",
      "description",
      "capacity",
      "coach_id",
      "location_id",
      "level_id",
      "category_id",
      "start_date",
      "end_date",
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
      // (tuỳ ý) nếu muốn đếm enrollments để show thêm chi tiết:
      // const enrollCnt = await classesModel.countEnrollmentsOfClass(id);
      return res.status(409).json({
        ok: false,
        message: "Cannot delete class: it still has sessions",
        details: { sessions: sessionsCnt },
        // , enrollments: enrollCnt
      });
    }

    // 3) Thực hiện xoá
    const affected = await classesModel.deleteClass(id);
    if (!affected) {
      // Về lý thuyết không vào đây nữa vì đã check exists ở trên, nhưng để an toàn:
      return res.status(404).json({ ok: false, message: "Class not found" });
    }

    return res.status(204).end();
  } catch (e) {
    // 4) Ánh xạ lỗi FK về 409 (tuỳ driver/DB)
    const fkCodes = new Set([
      1451, // MySQL ER_ROW_IS_REFERENCED_2
      "ER_ROW_IS_REFERENCED_2",
      "ER_ROW_IS_REFERENCED",
      "SQLITE_CONSTRAINT_FOREIGNKEY", // nếu local test SQLite
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
