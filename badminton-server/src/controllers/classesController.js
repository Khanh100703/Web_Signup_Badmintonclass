// src/controllers/classesController.js
import { pool } from "../db.js";

/**
 * GET /api/classes
 * Hỗ trợ filter: level_id, coach_id, location_id, q (tìm theo title/description)
 * Trả danh sách lớp UPCOMING/ONGOING + seats_remaining
 */
export async function listClasses(req, res) {
  const { level_id, coach_id, location_id, q } = req.query;

  // Build điều kiện động an toàn
  const where = [`c.status IN ('UPCOMING','ONGOING')`];
  const params = [];

  if (level_id) {
    where.push(`c.level_id = ?`);
    params.push(Number(level_id));
  }
  if (coach_id) {
    where.push(`c.coach_id = ?`);
    params.push(Number(coach_id));
  }
  if (location_id) {
    where.push(`c.location_id = ?`);
    params.push(Number(location_id));
  }
  if (q && String(q).trim()) {
    where.push(`(c.title LIKE ? OR c.description LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.image_url,
        c.price,
        c.capacity,
        c.start_date,
        c.end_date,
        c.status,
        l.name  AS location_name,
        ch.name AS coach_name,
        lv.name AS level_name,
        cat.name AS category_name,
        -- ghế còn lại = capacity - số đơn PENDING_PAYMENT/PAID
        (c.capacity - IFNULL((
          SELECT COUNT(*)
          FROM enrollments e
          WHERE e.class_id = c.id
            AND e.status IN ('PENDING_PAYMENT','PAID')
        ),0)) AS seats_remaining
      FROM classes c
      LEFT JOIN locations        l   ON l.id   = c.location_id
      LEFT JOIN coaches          ch  ON ch.id  = c.coach_id
      LEFT JOIN class_levels     lv  ON lv.id  = c.level_id
      LEFT JOIN class_categories cat ON cat.id = c.category_id
      ${whereSql}
      ORDER BY c.start_date IS NULL, c.start_date ASC, c.id DESC
      `,
      params
    );

    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("listClasses error:", e);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      detail: String(e?.message || e),
    });
  }
}

/**
 * GET /api/classes/:id
 * Trả chi tiết lớp + danh sách sessions của lớp
 */
export async function getClassDetail(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, message: "Invalid id" });

  const conn = await pool.getConnection();
  try {
    // Thông tin lớp + mô tả/ảnh/coach/location/level/category
    const [[c]] = await conn.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.image_url,
        c.price,
        c.capacity,
        c.start_date,
        c.end_date,
        c.status,
        c.coach_id,
        c.location_id,
        c.level_id,
        c.category_id,
        ch.name  AS coach_name,
        ch.email AS coach_email,
        ch.phone AS coach_phone,
        ch.photo_url AS coach_photo_url,
        l.name   AS location_name,
        l.address AS location_address,
        lv.name  AS level_name,
        cat.name AS category_name,
        (c.capacity - IFNULL((
          SELECT COUNT(*)
          FROM enrollments e
          WHERE e.class_id = c.id
            AND e.status IN ('PENDING_PAYMENT','PAID')
        ),0)) AS seats_remaining
      FROM classes c
      LEFT JOIN coaches          ch  ON ch.id  = c.coach_id
      LEFT JOIN locations        l   ON l.id   = c.location_id
      LEFT JOIN class_levels     lv  ON lv.id  = c.level_id
      LEFT JOIN class_categories cat ON cat.id = c.category_id
      WHERE c.id = ?
      `,
      [id]
    );

    if (!c)
      return res.status(404).json({ ok: false, message: "Class not found" });

    // Danh sách buổi
    const [sessions] = await conn.query(
      `
      SELECT id, class_id, session_no, start_time, end_time, capacity
      FROM sessions
      WHERE class_id = ?
      ORDER BY start_time ASC
      `,
      [id]
    );

    const data = {
      id: c.id,
      title: c.title,
      description: c.description,
      image_url: c.image_url,
      price: c.price,
      capacity: c.capacity,
      seats_remaining: Number(c.seats_remaining ?? 0),
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      coach_id: c.coach_id,
      location_id: c.location_id,
      level_id: c.level_id,
      category_id: c.category_id,
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
      sessions,
    };

    return res.json({ ok: true, data });
  } catch (e) {
    console.error("getClassDetail error:", e);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      detail: String(e?.message || e),
    });
  } finally {
    conn.release();
  }
}

/**
 * POST /api/classes
 * Body tối thiểu: { title, coach_id }
 * Các field khác theo bảng classes: description, image_url, price, capacity, start_date, end_date, status, location_id, level_id, category_id
 */
export async function createClass(req, res) {
  const {
    title,
    coach_id,
    description = null,
    image_url = null,
    price = 0,
    capacity = 0,
    start_date = null,
    end_date = null,
    status = "UPCOMING",
    location_id = null,
    level_id = null,
    category_id = null,
  } = req.body || {};

  if (!title || !coach_id) {
    return res
      .status(400)
      .json({ ok: false, message: "title and coach_id are required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ins] = await conn.query(
      `
      INSERT INTO classes
      (title, coach_id, location_id, level_id, category_id, capacity, price, description, image_url, start_date, end_date, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        title,
        coach_id,
        location_id,
        level_id,
        category_id,
        capacity,
        price,
        description,
        image_url,
        start_date,
        end_date,
        status,
      ]
    );

    await conn.commit();
    // trả chi tiết ngay
    req.params.id = ins.insertId;
    return getClassDetail(req, res);
  } catch (e) {
    await conn.rollback();
    console.error("createClass error:", e);
    return res.status(500).json({
      ok: false,
      message: "Create failed",
      detail: String(e?.message || e),
    });
  } finally {
    conn.release();
  }
}

/**
 * PUT /api/classes/:id
 * Body: bất kỳ field nào trong bảng classes
 */
export async function updateClass(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "id is required" });
  }
  const allow = new Set([
    "title",
    "coach_id",
    "location_id",
    "level_id",
    "category_id",
    "capacity",
    "price",
    "description",
    "image_url",
    "start_date",
    "end_date",
    "status",
  ]);

  const payload = req.body || {};
  const fields = [];
  const params = [];
  for (const k of Object.keys(payload)) {
    if (allow.has(k)) {
      fields.push(`${k} = ?`);
      params.push(payload[k]);
    }
  }
  if (!fields.length) {
    return res.status(400).json({ ok: false, message: "No fields to update" });
  }

  try {
    const [r] = await pool.query(
      `UPDATE classes SET ${fields.join(", ")} WHERE id=?`,
      [...params, id]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ ok: false, message: "Class not found" });
    }
    // trả chi tiết
    return getClassDetail(req, res);
  } catch (e) {
    console.error("updateClass error:", e);
    return res.status(500).json({
      ok: false,
      message: "Update failed",
      detail: String(e?.message || e),
    });
  }
}

/**
 * DELETE /api/classes/:id
 * Chỉ cho xoá khi không còn session nào của lớp (tránh orphan)
 */
export async function deleteClass(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "id is required" });
  }

  const conn = await pool.getConnection();
  try {
    // còn sessions -> 409
    const [[cnt]] = await conn.query(
      `SELECT COUNT(*) AS n FROM sessions WHERE class_id=?`,
      [id]
    );
    if (cnt.n > 0) {
      return res.status(409).json({
        ok: false,
        message: "Cannot delete class: it still has sessions",
        details: { sessions: cnt.n },
      });
    }

    const [r] = await conn.query(`DELETE FROM classes WHERE id=?`, [id]);
    if (!r.affectedRows) {
      return res.status(404).json({ ok: false, message: "Class not found" });
    }
    return res.status(204).end();
  } catch (e) {
    console.error("deleteClass error:", e);
    return res.status(500).json({
      ok: false,
      message: "Delete failed",
      detail: String(e?.message || e),
    });
  } finally {
    conn.release();
  }
}
