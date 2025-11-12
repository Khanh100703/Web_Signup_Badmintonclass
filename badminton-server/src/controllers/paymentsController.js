import { pool } from "../db.js";
import { validationResult } from "express-validator";

/** POST /api/payments/init */
export async function initPaymentPending(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const userId = req.user.id;
  const { enrollment_id, amount, method } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra enrollment thuộc về user đang đăng nhập, còn trạng thái để thanh toán
    const [[en]] = await conn.query(
      `SELECT id, user_id, class_id, status FROM enrollments WHERE id=? FOR UPDATE`,
      [enrollment_id]
    );
    if (!en) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });
    }
    if (en.user_id !== userId) {
      await conn.rollback();
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (!["PENDING_PAYMENT", "PAID"].includes(en.status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Invalid enrollment status" });
    }

    // Tạo payment PENDING
    const [p] = await conn.query(
      `INSERT INTO payments (enrollment_id, amount, method, status) VALUES (?,?,?, 'PENDING')`,
      [enrollment_id, amount, method]
    );

    // (Nếu là VNPAY/MOMO) -> trả về thông tin/URL để redirect, ở đây demo trả payment_id
    await conn.commit();
    return res.status(201).json({ ok: true, payment_id: p.insertId });
  } catch (e) {
    await conn.rollback();
    console.error("initPaymentPending", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}

/** GET /api/payments/my */
export async function listMyPayments(req, res) {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT p.*, e.class_id, c.title AS class_title
         FROM payments p
         JOIN enrollments e ON e.id = p.enrollment_id
         JOIN classes c     ON c.id = e.class_id
        WHERE e.user_id = ?
        ORDER BY p.created_at DESC`,
      [userId]
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("listMyPayments", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/** POST /api/payments/confirm (ADMIN) — xác nhận tay BANK_TRANSFER/CASH */
export async function confirmPaymentAdmin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { enrollment_id, amount, method, transaction_code = null } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[en]] = await conn.query(
      `SELECT id, status FROM enrollments WHERE id=? FOR UPDATE`,
      [enrollment_id]
    );
    if (!en) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Enrollment not found" });
    }
    if (!["PENDING_PAYMENT", "PAID"].includes(en.status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Invalid enrollment status" });
    }

    // Ghi nhận thanh toán thành công (idempotent qua transaction_code nếu có)
    if (transaction_code) {
      // tránh trùng nếu webhook/nhập tay lặp lại
      const [dup] = await conn.query(
        `SELECT id FROM payments WHERE transaction_code = ?`,
        [transaction_code]
      );
      if (dup.length) {
        await conn.rollback();
        return res
          .status(200)
          .json({ ok: true, message: "Already confirmed (idempotent)" });
      }
    }

    await conn.query(
      `INSERT INTO payments (enrollment_id, amount, method, status, transaction_code, paid_at)
       VALUES (?,?,?,?,?, NOW())`,
      [enrollment_id, amount, method, "SUCCESS", transaction_code]
    );

    // cập nhật đơn
    await conn.query(`UPDATE enrollments SET status='PAID' WHERE id=?`, [
      enrollment_id,
    ]);

    await conn.commit();
    return res.json({
      ok: true,
      message: "Payment confirmed → enrollment = PAID",
    });
  } catch (e) {
    await conn.rollback();
    console.error("confirmPaymentAdmin", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}

/** POST /api/payments/webhook/:provider — demo khung xử lý cổng thanh toán */
export async function webhookGatewayDemo(req, res) {
  const provider = req.params.provider; // 'vnpay' | 'momo' | ...
  // TODO: kiểm tra chữ ký (signature) tùy provider
  const { enrollment_id, amount, transaction_code, status } = req.body; // status: 'SUCCESS'|'FAILED'

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // idempotency theo transaction_code nếu có
    if (transaction_code) {
      const [dup] = await conn.query(
        `SELECT id FROM payments WHERE transaction_code=?`,
        [transaction_code]
      );
      if (dup.length) {
        await conn.rollback();
        return res.status(200).json({ ok: true, message: "Ignored duplicate" });
      }
    }

    const payStatus = status === "SUCCESS" ? "SUCCESS" : "FAILED";
    await conn.query(
      `INSERT INTO payments (enrollment_id, amount, method, status, transaction_code, paid_at)
       VALUES (?, ?, ?, ?, ?, CASE WHEN ?='SUCCESS' THEN NOW() ELSE NULL END)`,
      [
        enrollment_id,
        amount,
        provider.toUpperCase(),
        payStatus,
        transaction_code,
        status,
      ]
    );

    if (status === "SUCCESS") {
      await conn.query(`UPDATE enrollments SET status='PAID' WHERE id=?`, [
        enrollment_id,
      ]);
    }

    await conn.commit();
    return res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("webhookGatewayDemo", e);
    return res.status(500).json({ ok: false });
  } finally {
    conn.release();
  }
}
