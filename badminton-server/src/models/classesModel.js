import { pool } from "../db.js";

// cột PK trong bảng của bạn là id_classes
export async function getAllClasses() {
  const [rows] = await pool.query(`
    SELECT c.id, c.title, c.capacity, 
           c.coach_id, co.name AS coach_name,
           c.location_id, l.name AS location_name,
           c.level_id,  lv.name AS level_name,
           c.category_id, cat.name AS category_name
    FROM classes c
    LEFT JOIN coaches co ON co.id = c.coach_id
    LEFT JOIN locations l ON l.id = c.location_id
    LEFT JOIN class_levels lv ON lv.id = c.level_id
    LEFT JOIN class_categories cat ON cat.id = c.category_id
    ORDER BY c.id DESC
  `);
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
