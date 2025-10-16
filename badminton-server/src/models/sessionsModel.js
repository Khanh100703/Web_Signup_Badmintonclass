import { pool } from "../db.js";

export async function getSessionsByClass(classId) {
  const [rows] = await pool.query(
    `SELECT s.id,
            s.class_id,
            s.start_time,
            s.end_time,
            s.capacity,
            c.capacity AS class_capacity,
            COALESCE(enrolled.active_enrolled, 0) AS active_enrolled
     FROM sessions s
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN (
       SELECT session_id, COUNT(*) AS active_enrolled
       FROM enrollments
       WHERE status = 'ACTIVE'
       GROUP BY session_id
     ) AS enrolled ON enrolled.session_id = s.id
     WHERE s.class_id = ?
     ORDER BY s.start_time ASC`,
    [classId]
  );
  return rows;
}

export async function getSessionById(id) {
  const [rows] = await pool.query(
    `SELECT s.id,
            s.class_id,
            s.start_time,
            s.end_time,
            s.capacity,
            c.capacity AS class_capacity
     FROM sessions s
     JOIN classes c ON c.id = s.class_id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0];
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
