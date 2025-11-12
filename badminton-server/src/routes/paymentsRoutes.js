import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  confirmPaymentAdmin,
  initPaymentPending,
  listMyPayments,
  webhookGatewayDemo,
} from "../controllers/paymentsController.js";

const router = Router();

/**
 * Học viên: tạo bản ghi thanh toán PENDING (bank transfer/online)
 * body: { enrollment_id, amount, method }  // method: 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'CASH'
 */
router.post(
  "/init",
  requireAuth,
  body("enrollment_id").isInt({ gt: 0 }),
  body("amount").isFloat({ gt: 0 }),
  body("method").isIn(["VNPAY", "MOMO", "BANK_TRANSFER", "CASH"]),
  initPaymentPending
);

/** Học viên: xem lịch sử thanh toán của tôi */
router.get("/my", requireAuth, listMyPayments);

/** Admin: xác nhận đã nhận tiền thủ công (chuyển khoản/tiền mặt) */
router.post(
  "/confirm",
  requireAuth,
  requireRole("ADMIN"),
  body("enrollment_id").isInt({ gt: 0 }),
  body("amount").isFloat({ gt: 0 }),
  body("method").isIn(["BANK_TRANSFER", "CASH"]),
  body("transaction_code").optional().isString().isLength({ max: 100 }),
  confirmPaymentAdmin
);

/** Webhook cổng thanh toán (demo khung) */
router.post("/webhook/:provider", webhookGatewayDemo);

export default router;
