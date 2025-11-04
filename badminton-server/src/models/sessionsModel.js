import { pool } from "../db.js";

export async function getSessionsByClass(classId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.class_id, s.start_time, s.end_time, s.capacity
     FROM sessions s
     WHERE s.class_id = ?
     ORDER BY s.start_time ASC`,
    [classId]
  );
  return rows;
}

export async function getSessionsByClassIds(classIds = []) {
  if (!classIds.length) return [];
  const [rows] = await pool.query(
    `SELECT s.id, s.class_id, s.start_time, s.end_time, s.capacity
     FROM sessions s
     WHERE s.class_id IN (${classIds.map(() => "?").join(",")})
     ORDER BY s.start_time ASC`,
    classIds
  );
  return rows;
}

export async function createSession(payload) {
  const { class_id, start_time, end_time, capacity = null } = payload;
  const [result] = await pool.query(
    `INSERT INTO sessions (class_id, start_time, end_time, capacity)
     VALUES (?, ?, ?, ?)`,
    [class_id, start_time, end_time, capacity]
  );
  return { id: result.insertId };
}

export async function updateSession(id, data) {
  const allow = ["class_id", "start_time", "end_time", "capacity"];
  const fields = [];
  const args = [];
  for (const k of allow) {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      fields.push(`${k} = ?`);
      args.push(data[k]);
    }
  }
  if (!fields.length) return 0;
  args.push(id);
  const [result] = await pool.query(
    `UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`,
    args
  );
  return result.affectedRows;
}

export async function deleteSession(id) {
  const [result] = await pool.query(`DELETE FROM sessions WHERE id = ?`, [id]);
  return result.affectedRows;
}

export async function hasActiveEnrollments(id) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM enrollments
     WHERE session_id = ? AND status = 'ENROLLED'`,
    [id]
  );
  return (row?.cnt ?? 0) > 0;
}

export async function getSessionWithClass(id) {
  const [[row]] = await pool.query(
    `SELECT s.*, c.title AS class_title, c.description AS class_description,
            c.coach_id, c.image_url,
            l.name AS location_name, l.address AS location_address,
            co.name AS coach_name, co.email AS coach_email
     FROM sessions s
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN locations l ON l.id = c.location_id
     LEFT JOIN coaches co ON co.id = c.coach_id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  return row || null;
}

export async function listEnrolledUsers(sessionId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     WHERE e.session_id = ? AND e.status = 'ENROLLED' AND u.email IS NOT NULL AND u.email <> ''
     ORDER BY e.created_at ASC`,
    [sessionId]
  );
  return rows;
}

export async function listUpcomingSessions(limit = 50) {
  const [rows] = await pool.query(
    `SELECT s.id, s.class_id, s.start_time, s.end_time, s.capacity,
            c.title AS class_title,
            co.name AS coach_name
     FROM sessions s
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN coaches co ON co.id = c.coach_id
     WHERE s.start_time >= NOW()
     ORDER BY s.start_time ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}
