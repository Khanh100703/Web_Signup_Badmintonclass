import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  confirmCheckout,
  confirmPaymentAdmin,
  createCheckout,
  initPaymentPending,
  listMyPayments,
  webhookGatewayDemo,
} from "../controllers/paymentsController.js";

const router = Router();

router.post(
  "/create-checkout",
  requireAuth,
  body("class_id").isInt({ gt: 0 }),
  createCheckout
);

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

router.post(
  "/:id/confirm",
  requireAuth,
  param("id").isInt({ gt: 0 }),
  body("success").isBoolean(),
  body("method")
    .optional()
    .isIn(["VNPAY", "MOMO", "BANK_TRANSFER", "CASH"]),
  body("note").optional().isLength({ max: 255 }),
  confirmCheckout
);

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
