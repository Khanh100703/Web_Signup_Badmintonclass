// src/controllers/reportsController.js
import { pool } from "../db.js";

/**
 * GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&by=class|coach|day
 * Trả mảng dữ liệu tuỳ theo `by`.
 * - Nếu có bảng payments: tính revenue theo payments.status='SUCCESS'
 * - Nếu chưa dùng payments: fallback revenue = SUM(classes.price) của enrollments PAID
 */
export async function getSummary(req, res) {
  let { from, to, by = "class" } = req.query;

  // mặc định 30 ngày gần nhất
  const today = new Date();
  const d30 = new Date();
  d30.setDate(today.getDate() - 30);
  if (!from) from = d30.toISOString().slice(0, 10);
  if (!to) to = today.toISOString().slice(0, 10);

  // Khoảng thời gian inclusive: [from 00:00:00, to 23:59:59]
  const fromTs = `${from} 00:00:00`;
  const toTs = `${to} 23:59:59`;

  // Chọn SQL theo `by`
  let sql = "";
  let params = [fromTs, toTs];

  if (by === "class") {
    sql = `
      SELECT
        c.id               AS class_id,
        c.title            AS class_title,
        COUNT(e.id)        AS enroll_count,
        SUM(e.status='PAID') AS paid_count,
        -- doanh thu: ưu tiên theo payments (SUCCESS), nếu không có payments.amount thì dùng price
        COALESCE((
          SELECT IFNULL(SUM(p.amount), 0)
          FROM payments p
          WHERE p.enrollment_id IN (
            SELECT e2.id FROM enrollments e2
            WHERE e2.class_id = c.id
            AND e2.created_at BETWEEN ? AND ?
            AND e2.status='PAID'
          ) AND p.status='SUCCESS'
        ), 0) +
        CASE 
          WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='payments' AND table_schema = DATABASE()) = 0
          THEN IFNULL(SUM(CASE WHEN e.status='PAID' THEN c.price ELSE 0 END), 0)
          ELSE 0
        END AS revenue
      FROM classes c
      LEFT JOIN enrollments e
        ON e.class_id = c.id
       AND e.created_at BETWEEN ? AND ?
      GROUP BY c.id, c.title
      ORDER BY revenue DESC, enroll_count DESC;
    `;
    // params: 2 cho subquery payments + 2 cho join enrollments
    params = [fromTs, toTs, fromTs, toTs];
  } else if (by === "coach") {
    sql = `
      SELECT
        ch.id                AS coach_id,
        ch.name              AS coach_name,
        COUNT(e.id)          AS enroll_count,
        SUM(e.status='PAID') AS paid_count,
        COALESCE((
          SELECT IFNULL(SUM(p.amount), 0)
          FROM payments p
          WHERE p.enrollment_id IN (
            SELECT e2.id FROM enrollments e2
            JOIN classes c2 ON c2.id = e2.class_id
            WHERE c2.coach_id = ch.id
              AND e2.created_at BETWEEN ? AND ?
              AND e2.status='PAID'
          ) AND p.status='SUCCESS'
        ), 0) +
        CASE 
          WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='payments' AND table_schema = DATABASE()) = 0
          THEN IFNULL(SUM(CASE WHEN e.status='PAID' THEN c.price ELSE 0 END), 0)
          ELSE 0
        END AS revenue
      FROM coaches ch
      LEFT JOIN classes c ON c.coach_id = ch.id
      LEFT JOIN enrollments e
        ON e.class_id = c.id
       AND e.created_at BETWEEN ? AND ?
      GROUP BY ch.id, ch.name
      ORDER BY revenue DESC, enroll_count DESC;
    `;
    params = [fromTs, toTs, fromTs, toTs];
  } else if (by === "day") {
    sql = `
      SELECT
        DATE(e.created_at)  AS date,
        COUNT(e.id)         AS enroll_count,
        SUM(e.status='PAID') AS paid_count,
        COALESCE((
          SELECT IFNULL(SUM(p.amount), 0)
          FROM payments p
          JOIN enrollments e2 ON e2.id = p.enrollment_id
          WHERE DATE(e2.created_at) = DATE(e.created_at)
            AND p.status='SUCCESS'
        ), 0) +
        CASE 
          WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='payments' AND table_schema = DATABASE()) = 0
          THEN IFNULL(SUM(CASE WHEN e.status='PAID' THEN c.price ELSE 0 END), 0)
          ELSE 0
        END AS revenue
      FROM enrollments e
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE e.created_at BETWEEN ? AND ?
      GROUP BY DATE(e.created_at)
      ORDER BY date ASC;
    `;
    params = [fromTs, toTs];
  } else {
    return res
      .status(400)
      .json({ ok: false, message: "by must be class|coach|day" });
  }

  try {
    const [rows] = await pool.query(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("reports.getSummary", err);
    return res
      .status(500)
      .json({
        ok: false,
        message: "Server error",
        detail: String(err?.message || err),
      });
  }
}
