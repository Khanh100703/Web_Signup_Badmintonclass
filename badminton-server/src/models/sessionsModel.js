import { pool } from "../db.js";

// PK trong bảng: id_sessions; FK class_id → classes.id_classes
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

export async function createSession(payload) {
  const { class_id, start_time, end_time, capacity = null } = payload;
  const [result] = await pool.query(
    `INSERT INTO sessions (class_id, start_time, end_time, capacity)
     VALUES (?, ?, ?, ?)`,
    [class_id, start_time, end_time, capacity]
  );
  return { id_sessions: result.insertId };
}
