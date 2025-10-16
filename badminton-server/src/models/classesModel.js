import { pool } from "../db.js";

function buildFilters({ level, coach_id, location_id, q }) {
  const conditions = [];
  const params = [];
  if (level) {
    conditions.push("c.level_id = ?");
    params.push(level);
  }
  if (coach_id) {
    conditions.push("c.coach_id = ?");
    params.push(coach_id);
  }
  if (location_id) {
    conditions.push("c.location_id = ?");
    params.push(location_id);
  }
  if (q) {
    const keyword = `%${q}%`;
    conditions.push("(c.title LIKE ? OR c.description LIKE ?)");
    params.push(keyword, keyword);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export async function getAllClasses(filters = {}) {
  const { where, params } = buildFilters(filters);
  const [rows] = await pool.query(
    `SELECT c.id,
            c.title,
            c.description,
            c.capacity,
            c.coach_id,
            c.location_id,
            c.level_id,
            c.category_id,
            c.start_date,
            c.end_date,
            co.name AS coach_name,
            co.avatar_url AS coach_avatar,
            co.experience_years AS coach_experience_years,
            l.name AS location_name,
            lv.name AS level_name,
            cat.name AS category_name,
            GREATEST(COALESCE(c.capacity, 0) - COALESCE(enrolled.total_enrolled, 0), 0) AS available_slots
     FROM classes c
     LEFT JOIN coaches co ON co.id = c.coach_id
     LEFT JOIN locations l ON l.id = c.location_id
     LEFT JOIN class_levels lv ON lv.id = c.level_id
     LEFT JOIN class_categories cat ON cat.id = c.category_id
     LEFT JOIN (
       SELECT s.class_id, COUNT(e.id) AS total_enrolled
       FROM sessions s
       JOIN enrollments e ON e.session_id = s.id AND e.status = 'ACTIVE'
       GROUP BY s.class_id
     ) AS enrolled ON enrolled.class_id = c.id
     ${where}
     ORDER BY c.start_date IS NULL, c.start_date ASC, c.id DESC`,
    params
  );
  return rows;
}

export async function getClassById(id) {
  const [rows] = await pool.query(
    `SELECT c.id,
            c.title,
            c.description,
            c.capacity,
            c.coach_id,
            c.location_id,
            c.level_id,
            c.category_id,
            c.start_date,
            c.end_date,
            co.name AS coach_name,
            co.avatar_url AS coach_avatar,
            co.experience_years AS coach_experience_years,
            co.bio AS coach_bio,
            l.name AS location_name,
            lv.name AS level_name,
            cat.name AS category_name
     FROM classes c
     LEFT JOIN coaches co ON co.id = c.coach_id
     LEFT JOIN locations l ON l.id = c.location_id
     LEFT JOIN class_levels lv ON lv.id = c.level_id
     LEFT JOIN class_categories cat ON cat.id = c.category_id
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0];
}

export async function getUpcomingSessionsForClass(classId) {
  const [rows] = await pool.query(
    `SELECT s.id,
            s.class_id,
            s.start_time,
            s.end_time,
            s.capacity,
            COALESCE(enrolled.active_enrolled, 0) AS active_enrolled
     FROM sessions s
     LEFT JOIN (
       SELECT session_id, COUNT(*) AS active_enrolled
       FROM enrollments
       WHERE status = 'ACTIVE'
       GROUP BY session_id
     ) AS enrolled ON enrolled.session_id = s.id
     WHERE s.class_id = ? AND s.start_time >= NOW()
     ORDER BY s.start_time ASC`,
    [classId]
  );
  return rows;
}

export async function createClass(payload) {
  const {
    title,
    coach_id,
    location_id = null,
    level_id = null,
    category_id = null,
    capacity = 0,
    description = null,
    start_date = null,
    end_date = null,
  } = payload;

  const [result] = await pool.query(
    `INSERT INTO classes
     (title, coach_id, location_id, level_id, category_id, capacity, description, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      coach_id,
      location_id,
      level_id,
      category_id,
      capacity,
      description,
      start_date,
      end_date,
    ]
  );
  return { id: result.insertId };
}
