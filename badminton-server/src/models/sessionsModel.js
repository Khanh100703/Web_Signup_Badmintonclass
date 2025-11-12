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
