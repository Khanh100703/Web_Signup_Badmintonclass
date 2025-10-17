import { pool } from "../db.js";

// PK: id_sessions; FK: class_id → classes.id_classes
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

// NEW: Update session
export async function updateSession(id, data) {
  const fields = [];
  const args = [];
  const allow = ["class_id", "start_time", "end_time", "capacity"];

  for (const k of allow) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      args.push(data[k]);
    }
  }
  if (fields.length === 0) return 0;

  args.push(id);
  const [result] = await pool.query(
    `UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`,
    args
  );
  return result.affectedRows;
}

// NEW: Delete session
export async function deleteSession(id) {
  const [result] = await pool.query(`DELETE FROM sessions WHERE id = ?`, [id]);
  return result.affectedRows;
}
