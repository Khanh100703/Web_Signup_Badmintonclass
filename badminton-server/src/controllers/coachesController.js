// ✅ Dùng named export cho pool (khớp với db.js của bạn)
import { pool } from "../db.js";
import * as classesModel from "../models/classesModel.js";

// ===== COACHES CRUD =====
export async function list(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, phone, email, experience, photo_url
       FROM coaches
       ORDER BY name`
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("coaches.list error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function detail(req, res) {
  const { id } = req.params;
  try {
    const [[row]] = await pool.query(
      `SELECT id, name, phone, email, experience, photo_url
       FROM coaches
       WHERE id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, data: row });
  } catch (e) {
    console.error("coaches.detail error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function create(req, res) {
  const { name, phone, email, experience, photo_url } = req.body || {};
  try {
    const [r] = await pool.query(
      `INSERT INTO coaches (name, phone, email, experience, photo_url)
       VALUES (?,?,?,?,?)`,
      [
        name,
        phone || null,
        email || null,
        experience || null,
        photo_url || null,
      ]
    );
    return res.status(201).json({ ok: true, id: r.insertId });
  } catch (e) {
    console.error("coaches.create error:", e);
    return res.status(500).json({ ok: false, message: "Create failed" });
  }
}

export async function update(req, res) {
  const { id } = req.params;
  const { name, phone, email, experience, photo_url } = req.body || {};
  try {
    const [r] = await pool.query(
      `UPDATE coaches
       SET name=?, phone=?, email=?, experience=?, photo_url=?
       WHERE id=?`,
      [
        name,
        phone || null,
        email || null,
        experience || null,
        photo_url || null,
        id,
      ]
    );
    if (!r.affectedRows)
      return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("coaches.update error:", e);
    return res.status(500).json({ ok: false, message: "Update failed" });
  }
}

export async function remove(req, res) {
  const { id } = req.params;
  try {
    const [r] = await pool.query(`DELETE FROM coaches WHERE id = ?`, [id]);
    if (!r.affectedRows) {
      return res.status(404).json({ ok: false, message: "Not found" });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error("coaches.remove error:", e);
    return res.status(500).json({ ok: false, message: "Delete failed" });
  }
}

export async function myClasses(req, res) {
  try {
    const isAdmin = req.user.role === "ADMIN";
    let coachId = null;
    let coachInfo = null;

    if (isAdmin && req.query.coach_id) {
      coachId = Number(req.query.coach_id);
      if (!coachId)
        return res.status(400).json({ ok: false, message: "Invalid coach_id" });
      const [[c]] = await pool.query(
        "SELECT id, name, email FROM coaches WHERE id=?",
        [coachId]
      );
      if (!c)
        return res.status(404).json({ ok: false, message: "Coach not found" });
      coachInfo = c;
    } else {
      const [[userRow]] = await pool.query(
        "SELECT id, email, name FROM users WHERE id=?",
        [req.user.id]
      );
      if (!userRow)
        return res.status(404).json({ ok: false, message: "User not found" });

      const [[coachRow]] = await pool.query(
        "SELECT id, name, email FROM coaches WHERE email = ?",
        [userRow.email]
      );
      if (!coachRow) {
        return res.json({ ok: true, data: [], coach: null });
      }
      coachId = coachRow.id;
      coachInfo = coachRow;
    }

    const classes = await classesModel.getClasses({ coach_id: coachId });
    if (!classes.length) {
      return res.json({ ok: true, data: [], coach: coachInfo });
    }

    const ids = classes.map((c) => c.id);
    const placeholders = ids.map(() => "?").join(",");
    const [sessions] = await pool.query(
      `SELECT id, class_id, start_time, end_time, capacity
       FROM sessions
       WHERE class_id IN (${placeholders})
       ORDER BY start_time ASC`,
      ids
    );

    const grouped = sessions.reduce((acc, session) => {
      acc[session.class_id] = acc[session.class_id] || [];
      acc[session.class_id].push(session);
      return acc;
    }, {});

    const data = classes.map((clazz) => ({
      ...clazz,
      sessions: grouped[clazz.id] || [],
    }));

    return res.json({ ok: true, data, coach: coachInfo });
  } catch (error) {
    console.error("coaches.myClasses error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/* ===== Tuỳ chọn: lịch rảnh/blackout nếu bạn đang dùng, giữ nguyên cũng được ===== */
export async function listAvailabilities(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT id, coach_id, weekday, start_time, end_time
     FROM coach_availabilities
     WHERE coach_id = ?
     ORDER BY weekday, start_time`,
    [id]
  );
  return res.json({ ok: true, data: rows });
}

export async function addAvailability(req, res) {
  const { id } = req.params;
  const { weekday, start_time, end_time } = req.body;
  const [r] = await pool.query(
    `INSERT INTO coach_availabilities (coach_id, weekday, start_time, end_time)
     VALUES (?,?,?,?)`,
    [id, weekday, start_time, end_time]
  );
  return res.status(201).json({ ok: true, id: r.insertId });
}

export async function removeAvailability(req, res) {
  const { availId } = req.params;
  await pool.query(`DELETE FROM coach_availabilities WHERE id = ?`, [availId]);
  return res.json({ ok: true });
}

export async function listBlackouts(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT id, coach_id, date
     FROM blackout_dates
     WHERE coach_id = ?
     ORDER BY date`,
    [id]
  );
  return res.json({ ok: true, data: rows });
}

export async function addBlackout(req, res) {
  const { id } = req.params;
  const { date } = req.body;
  const [r] = await pool.query(
    `INSERT INTO blackout_dates (coach_id, date) VALUES (?,?)`,
    [id, date]
  );
  return res.status(201).json({ ok: true, id: r.insertId });
}

export async function removeBlackout(req, res) {
  const { bid } = req.params;
  await pool.query(`DELETE FROM blackout_dates WHERE id = ?`, [bid]);
  return res.json({ ok: true });
}
