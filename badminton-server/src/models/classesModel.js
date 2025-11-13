import { pool } from "../db.js";

export async function getClasses(filters = {}) {
  const { level_id, coach_id, location_id, q } = filters;
  const where = [];
  const args = [];

  if (level_id) {
    where.push("c.level_id = ?");
    args.push(level_id);
  }
  if (coach_id) {
    where.push("c.coach_id = ?");
    args.push(coach_id);
  }
  if (location_id) {
    where.push("c.location_id = ?");
    args.push(location_id);
  }
  if (q) {
    where.push("(c.title LIKE ? OR c.description LIKE ?)");
    args.push(`%${q}%`, `%${q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT
      c.id, c.title, c.description, c.capacity AS class_capacity,
      c.image_url,
      c.start_date,
      c.end_date,
      c.coach_id, co.name AS coach_name,
      c.location_id, l.name AS location_name,
      c.level_id, lv.name AS level_name,
      c.category_id, cat.name AS category_name,
      -- chỗ trống: tổng capacity class - tổng số đã enroll trong tương lai (ước lượng)
      (COALESCE(c.capacity, 0) - COALESCE((
          SELECT COUNT(e.id)
          FROM enrollments e
          WHERE e.class_id = c.id
            AND e.status IN ('PAID', 'PENDING_PAYMENT', 'WAITLIST')
      ), 0)) AS remaining_estimate
    FROM classes c
    LEFT JOIN coaches co ON co.id = c.coach_id
    LEFT JOIN locations l ON l.id = c.location_id
    LEFT JOIN class_levels lv ON lv.id = c.level_id
    LEFT JOIN class_categories cat ON cat.id = c.category_id
    ${whereSql}
    ORDER BY c.id DESC
    `,
    args
  );
  return rows;
}

export async function getClassDetail(id) {
  const [[cls]] = await pool.query(
    `SELECT c.*, co.name AS coach_name, l.name AS location_name
     FROM classes c
     LEFT JOIN coaches co ON co.id = c.coach_id
     LEFT JOIN locations l ON l.id = c.location_id
     WHERE c.id = ?`,
    [id]
  );
  const [sessions] = await pool.query(
    `SELECT s.*, 
            COALESCE(s.capacity, c.capacity) AS capacity_effective,
            (SELECT COUNT(*) FROM enrollments e WHERE e.session_id = s.id AND e.status='ENROLLED') AS enrolled_count
     FROM sessions s
     JOIN classes c ON c.id = s.class_id
     WHERE s.class_id = ?
     ORDER BY s.start_time ASC`,
    [id]
  );
  return { cls, sessions };
}

export async function createClass(data) {
  const {
    title,
    description = null,
    capacity = null,
    coach_id,
    location_id = null,
    level_id = null,
    category_id = null,
    image_url = null,
    start_date = null,
    end_date = null,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO classes
      (title, description, capacity, coach_id, location_id, level_id, category_id, image_url, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      capacity,
      coach_id,
      location_id,
      level_id,
      category_id,
      image_url,
      start_date,
      end_date,
    ]
  );
  return result.insertId;
}

export async function updateClass(id, data) {
  const fields = [];
  const args = [];

  const allow = [
    "title",
    "description",
    "capacity",
    "coach_id",
    "location_id",
    "level_id",
    "category_id",
    "image_url",
    "start_date",
    "end_date",
  ];
  for (const k of allow) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      args.push(data[k]);
    }
  }
  if (fields.length === 0) return 0;

  args.push(id);
  const [result] = await pool.query(
    `UPDATE classes SET ${fields.join(", ")} WHERE id = ?`,
    args
  );
  return result.affectedRows;
}

export async function existsClassById(id) {
  const [rows] = await pool.query(
    "SELECT 1 AS ok FROM classes WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length > 0;
}

/** Đếm số session của class */
export async function countSessionsOfClass(classId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM sessions
     WHERE class_id = ?`,
    [classId]
  );
  return rows?.[0]?.cnt ?? 0;
}

/** Đếm enrollments thuộc các session của class (phòng khi bạn muốn hiển thị chi tiết) */
export async function countEnrollmentsOfClass(classId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM enrollments e
     JOIN sessions s ON s.id = e.session_id
     WHERE s.class_id = ?`,
    [classId]
  );
  return rows?.[0]?.cnt ?? 0;
}

/** Xoá class theo id – ném lỗi nếu MySQL báo lỗi FK */
export async function deleteClass(id) {
  try {
    const [res] = await pool.query(`DELETE FROM classes WHERE id = ?`, [id]);
    return res.affectedRows; // 1 nếu xoá, 0 nếu không thấy
  } catch (err) {
    // chuyển tiếp cho controller ánh xạ mã lỗi
    throw err;
  }
}
