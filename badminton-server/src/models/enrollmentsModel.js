import { pool } from "../db.js";

export async function getEnrollmentByUserAndSession(userId, sessionId, connection = pool) {
  const [rows] = await connection.query(
    `SELECT id, user_id, session_id, status, created_at, cancelled_at
     FROM enrollments
     WHERE user_id = ? AND session_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [userId, sessionId]
  );
  return rows[0];
}

export async function countActiveEnrollmentsForSession(sessionId, connection = pool) {
  const [[row]] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM enrollments
     WHERE session_id = ? AND status = 'ACTIVE'`,
    [sessionId]
  );
  return row?.total || 0;
}

export async function createEnrollment({ userId, sessionId, maxCapacity }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const existing = await getEnrollmentByUserAndSession(userId, sessionId, connection);
    if (existing && existing.status === "ACTIVE") {
      const err = new Error("Bạn đã đăng ký buổi học này");
      err.code = "DUPLICATE_ENROLLMENT";
      throw err;
    }

    const activeCount = await countActiveEnrollmentsForSession(sessionId, connection);
    if (typeof maxCapacity === "number" && activeCount >= maxCapacity) {
      const err = new Error("Lớp học đã đủ số lượng học viên");
      err.code = "SESSION_FULL";
      throw err;
    }

    const [result] = await connection.query(
      `INSERT INTO enrollments (user_id, session_id, status, created_at)
       VALUES (?, ?, 'ACTIVE', NOW())`,
      [userId, sessionId]
    );

    await connection.commit();
    return { id: result.insertId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function markEnrollmentCancelled(enrollmentId, connection = pool) {
  const [result] = await connection.query(
    `UPDATE enrollments
     SET status = 'CANCELLED', cancelled_at = NOW()
     WHERE id = ?`,
    [enrollmentId]
  );
  return result;
}

export async function findEnrollmentById(id) {
  const [rows] = await pool.query(
    `SELECT e.id, e.user_id, e.session_id, e.status, e.created_at, e.cancelled_at,
            s.start_time, s.end_time, s.class_id,
            c.capacity AS class_capacity,
            s.capacity AS session_capacity
     FROM enrollments e
     JOIN sessions s ON s.id = e.session_id
     JOIN classes c ON c.id = s.class_id
     WHERE e.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0];
}

export async function listScheduleByUser(userId) {
  const [rows] = await pool.query(
    `SELECT e.id AS enrollment_id,
            e.status AS enrollment_status,
            e.created_at,
            e.cancelled_at,
            s.id AS session_id,
            s.start_time,
            s.end_time,
            s.capacity AS session_capacity,
            c.id AS class_id,
            c.title AS class_title,
            c.capacity AS class_capacity,
            co.name AS coach_name,
            l.name AS location_name
     FROM enrollments e
     JOIN sessions s ON s.id = e.session_id
     JOIN classes c ON c.id = s.class_id
     LEFT JOIN coaches co ON co.id = c.coach_id
     LEFT JOIN locations l ON l.id = c.location_id
     WHERE e.user_id = ?
     ORDER BY s.start_time ASC`,
    [userId]
  );
  return rows;
}
