import { pool } from "../db.js";
import { validationResult } from "express-validator";

// Không cho đăng ký/huỷ khi còn dưới X giờ trước giờ bắt đầu (buổi đầu tiên)
const MIN_HOURS_BEFORE = 2;

/**
 * POST /api/enrollments
 * Body: { class_id, note? }
 */
export async function enrollClass(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const userId = req.user.id;
  const { class_id, note = null } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Lớp có tồn tại & đang mở không?
    const [[klass]] = await conn.query(
      `SELECT id, capacity, status FROM classes WHERE id=? FOR UPDATE`,
      [class_id]
    );
    if (!klass) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "Class not found" });
    }
    if (!["UPCOMING", "ONGOING"].includes(klass.status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Class is not open for enrollment" });
    }

    // 2) Đã có đăng ký trước đó chưa? (unique class_id + user_id)
    const [dup] = await conn.query(
      `SELECT id, status FROM enrollments WHERE class_id=? AND user_id=?`,
      [class_id, userId]
    );
    if (dup.length) {
      await conn.rollback();
      return res
        .status(409)
        .json({ ok: false, message: "You already enrolled this class" });
    }

    // 3) Check capacity (đếm PENDING_PAYMENT + PAID)
    const [[countRow]] = await conn.query(
      `SELECT COUNT(*) AS cnt
         FROM enrollments
        WHERE class_id=? AND status IN ('PENDING_PAYMENT','PAID')`,
      [class_id]
    );
    if (countRow.cnt >= (klass.capacity ?? 0)) {
      await conn.rollback();
      return res.status(409).json({ ok: false, message: "Class is full" });
    }

    // 4) Tạo enrollment ở trạng thái chờ thanh toán
    const [ins] = await conn.query(
      `INSERT INTO enrollments (user_id, class_id, status, note)
       VALUES (?, ?, 'PENDING_PAYMENT', ?)`,
      [userId, class_id, note]
    );

    await conn.commit();
    return res
      .status(201)
      .json({ ok: true, id: ins.insertId, status: "PENDING_PAYMENT" });
  } catch (err) {
    await conn.rollback();
    console.error("enrollClass error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}

/**
 * GET /api/enrollments/my
 * Trả danh sách đơn của tôi theo LỚP
 */
export async function myEnrollments(req, res) {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT
          e.id,
          e.status,
          e.note,
          e.created_at,
          c.id   AS class_id,
          c.title AS class_title,
          c.price,
          c.start_date,
          c.end_date,
          c.status AS class_status
        FROM enrollments e
        JOIN classes c ON c.id = e.class_id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC`,
      [userId]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("myEnrollments error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * DELETE /api/enrollments/:id
 * Huỷ theo ID bản ghi enrollment (chủ sở hữu mới được huỷ).
 * Chỉ cho huỷ nếu còn ≥ MIN_HOURS_BEFORE so với giờ bắt đầu của BUỔI ĐẦU TIÊN của lớp.
 */
export async function cancelEnrollmentById(req, res) {
  const userId = req.user.id;
  const id = Number(req.params.id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Lấy enrollment + thông tin lớp
    const [[row]] = await conn.query(
      `SELECT e.id, e.user_id, e.status, e.class_id,
              c.start_date, c.status AS class_status
         FROM enrollments e
         JOIN classes c ON c.id = e.class_id
        WHERE e.id = ? FOR UPDATE`,
      [id]
    );
    if (!row) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });
    }
    if (row.user_id !== userId) {
      await conn.rollback();
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (row.status !== "PENDING_PAYMENT" && row.status !== "PAID") {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "Cannot cancel" });
    }

    // 2) Kiểm tra thời gian: so với BUỔI ĐẦU TIÊN của class
    const [[firstSession]] = await conn.query(
      `SELECT start_time
         FROM sessions
        WHERE class_id = ?
        ORDER BY start_time ASC
        LIMIT 1`,
      [row.class_id]
    );
    if (firstSession?.start_time) {
      const now = new Date();
      const startAt = new Date(firstSession.start_time);
      const hoursUntil = (startAt - now) / (1000 * 60 * 60);
      if (hoursUntil <= 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({ ok: false, message: "Class already started" });
      }
      if (hoursUntil < MIN_HOURS_BEFORE) {
        await conn.rollback();
        return res.status(400).json({
          ok: false,
          message: `Cannot cancel within ${MIN_HOURS_BEFORE} hours before start`,
        });
      }
    }

    // 3) Huỷ
    await conn.query(`UPDATE enrollments SET status='CANCELLED' WHERE id=?`, [
      id,
    ]);

    await conn.commit();
    return res.json({ ok: true, message: "Cancelled" });
  } catch (err) {
    await conn.rollback();
    console.error("cancelEnrollmentById error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}
