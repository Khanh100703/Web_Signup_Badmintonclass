import { pool } from "../db.js";

export async function getAllLevels() {
  const [rows] = await pool.query(
    "SELECT id, name, description FROM class_levels ORDER BY id ASC"
  );
  return rows;
}
export async function getLevelById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, description FROM class_levels WHERE id=?",
    [id]
  );
  return rows[0] || null;
}
