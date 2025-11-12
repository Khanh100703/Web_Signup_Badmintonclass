import { pool } from "../db.js";

export async function getAllCategories() {
  const [rows] = await pool.query(
    "SELECT id, name, description FROM class_categories ORDER BY id ASC"
  );
  return rows;
}
export async function getCategoryById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, description FROM class_categories WHERE id=?",
    [id]
  );
  return rows[0] || null;
}
