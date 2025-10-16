import { pool } from "../db.js";

export async function listCoaches() {
  const [rows] = await pool.query(`
    SELECT c.id,
           c.name,
           c.experience_years,
           c.avatar_url,
           c.bio,
           COALESCE(class_counts.total_classes, 0) AS total_classes
    FROM coaches c
    LEFT JOIN (
      SELECT coach_id, COUNT(*) AS total_classes
      FROM classes
      GROUP BY coach_id
    ) AS class_counts ON class_counts.coach_id = c.id
    ORDER BY c.name ASC
  `);
  return rows;
}
