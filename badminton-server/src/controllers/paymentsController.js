import { pool } from "../db.js";
import { validationResult } from "express-validator";
import { ensurePaymentsTable } from "../utils/schema.js";
import { push as pushNotification } from "./notificationsController.js";

function normalizeMethod(method) {
  const allowed = ["BANK_TRANSFER", "CASH", "VNPAY", "MOMO"];
  if (allowed.includes(method)) return method;
  return "BANK_TRANSFER";
}

function formatCurrency(amount) {
  if (typeof amount !== "number") return `${amount}`;
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  });
}

export async function createCheckout(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const userId = req.user.id;
  const { class_id } = req.body;
  const classId = Number(class_id);
  if (!classId)
    return res
      .status(400)
      .json({ ok: false, message: "Mã lớp học không hợp lệ" });
  const conn = await pool.getConnection();

  try {
    await ensurePaymentsTable();
    await conn.beginTransaction();

    const [[klass]] = await conn.query(
      `SELECT id, title, price, capacity, status, coach_id, location_id
         FROM classes
        WHERE id = ?
        FOR UPDATE`,
      [classId]
    );

    if (!klass) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Không tìm thấy lớp học" });
    }

    if (!["UPCOMING", "ONGOING"].includes(klass.status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Lớp không mở đăng ký" });
    }

    const [[enrolledCount]] = await conn.query(
      `SELECT COUNT(*) AS cnt
         FROM enrollments
        WHERE class_id=? AND status IN ('PENDING_PAYMENT','PAID')`,
      [classId]
    );

    if (
      typeof klass.capacity === "number" &&
      klass.capacity > 0 &&
      enrolledCount.cnt >= klass.capacity
    ) {
      await conn.rollback();
      return res.status(409).json({ ok: false, message: "Lớp đã đủ học viên" });
    }

    const [existingEnrollments] = await conn.query(
      `SELECT id, status
         FROM enrollments
        WHERE class_id=? AND user_id=?
        FOR UPDATE`,
      [classId, userId]
    );

    let enrollmentId;
    if (existingEnrollments.length) {
      const enrollment = existingEnrollments[0];
      if (enrollment.status === "PAID") {
        await conn.rollback();
        return res
          .status(400)
          .json({ ok: false, message: "Bạn đã thanh toán lớp này" });
      }
      enrollmentId = enrollment.id;
    } else {
      const [ins] = await conn.query(
        `INSERT INTO enrollments (user_id, class_id, status)
         VALUES (?, ?, 'PENDING_PAYMENT')`,
        [userId, classId]
      );
      enrollmentId = ins.insertId;
    }

    const [[payment]] = await conn.query(
      `SELECT id, status, amount, method
         FROM payments
        WHERE enrollment_id=?
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE`,
      [enrollmentId]
    );

    let paymentId = payment?.id || null;
    let amount = payment?.amount ?? Number(klass.price ?? 0);
    const method = normalizeMethod(payment?.method || "BANK_TRANSFER");

    if (!payment || payment.status !== "PENDING") {
      const [insPay] = await conn.query(
        `INSERT INTO payments (enrollment_id, amount, method, status)
         VALUES (?, ?, ?, 'PENDING')`,
        [enrollmentId, Number(klass.price ?? 0), method]
      );
      paymentId = insPay.insertId;
      amount = Number(klass.price ?? 0);
    } else {
      paymentId = payment.id;
      amount = Number(payment.amount ?? klass.price ?? 0);
    }

    const [[coach]] = await conn.query(
      "SELECT id, name FROM coaches WHERE id=?",
      [klass.coach_id]
    );
    const [[location]] = await conn.query(
      "SELECT id, name, address FROM locations WHERE id=?",
      [klass.location_id]
    );

    await conn.commit();

    return res.json({
      ok: true,
      data: {
        enrollment_id: enrollmentId,
        payment_id: paymentId,
        amount,
        method,
        class: {
          id: klass.id,
          title: klass.title,
          price: klass.price,
          coach: coach || null,
          location: location || null,
        },
      },
    });
  } catch (e) {
    await conn.rollback();
    console.error("createCheckout", e?.message || e);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}

export async function confirmCheckout(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const paymentId = Number(req.params.id);
  const { success, method = "BANK_TRANSFER", note = null } = req.body;
  const conn = await pool.getConnection();

  try {
    await ensurePaymentsTable();
    await conn.beginTransaction();

    const [[pay]] = await conn.query(
      `SELECT p.id, p.enrollment_id, p.status, p.amount, p.method, e.class_id, e.user_id
         FROM payments p
         JOIN enrollments e ON e.id = p.enrollment_id
        WHERE p.id=?
        FOR UPDATE`,
      [paymentId]
    );

    if (!pay) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Không tìm thấy giao dịch" });
    }

    if (pay.user_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    if (pay.status === "SUCCESS") {
      await conn.rollback();
      return res.json({ ok: true, message: "Giao dịch đã hoàn tất" });
    }

    const nextMethod = normalizeMethod(method || pay.method);

    const [[klass]] = await conn.query(
      "SELECT title FROM classes WHERE id=?",
      [pay.class_id]
    );
    const classTitle = klass?.title || "lớp học";

    if (success) {
      await conn.query(
        `UPDATE payments
            SET status='SUCCESS', method=?, note=?, paid_at=NOW()
          WHERE id=?`,
        [nextMethod, note, paymentId]
      );
      await conn.query(
        `UPDATE enrollments SET status='PAID' WHERE id=?`,
        [pay.enrollment_id]
      );

      await pushNotification(
        req.user.id,
        "Thanh toán thành công",
        `Bạn đã thanh toán ${classTitle} thành công (${formatCurrency(
          Number(pay.amount || 0)
        )}).`
      );

      await conn.commit();
      return res.json({ ok: true, message: "Thanh toán thành công" });
    }

    await conn.query(
      `UPDATE payments SET status='FAILED', method=?, note=? WHERE id=?`,
      [nextMethod, note, paymentId]
    );
    await conn.commit();
    return res.json({ ok: true, message: "Đã ghi nhận thanh toán thất bại" });
  } catch (e) {
    await conn.rollback();
    console.error("confirmCheckout", e?.message || e);
    return res.status(500).json({ ok: false, message: "Server error" });
  } finally {
    conn.release();
  }
}

/** POST /api/payments/init */
export async function initPaymentPending(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const userId = req.user.id;
  const { enrollment_id, amount, method } = req.body;

  const conn = await pool.getConnection();
  try {
    await ensurePaymentsTable();
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
    await ensurePaymentsTable();
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
    await ensurePaymentsTable();
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
    await ensurePaymentsTable();
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
