import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { body, param } from "express-validator";
import {
  enrollClass,
  myEnrollments,
  cancelEnrollmentById,
  getAllEnrollments,
  updateEnrollmentStatus,
  confirmEnrollmentPayment,
} from "../controllers/enrollmentsController.js";

const router = Router();

// ========== ADMIN ROUTES ==========

// Admin: xem toàn bộ đăng ký (trang Admin -> tab Đăng ký & card Học viên đang tham gia)
router.get("/", requireAuth, requireRole(["ADMIN"]), getAllEnrollments);

// Admin: đổi trạng thái đăng ký
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(["ADMIN"]),
  updateEnrollmentStatus
);

// ========== USER ROUTES ==========

// Danh sách đơn của TÔI (theo lớp)
router.get("/my", requireAuth, myEnrollments);

// Đăng ký theo LỚP
router.post(
  "/",
  requireAuth,
  body("class_id").isInt({ gt: 0 }).withMessage("class_id is required"),
  body("note").optional().isString().isLength({ max: 255 }),
  enrollClass
);

// Huỷ theo ID của enrollment (user tự huỷ đơn của mình)
router.delete(
  "/:id",
  requireAuth,
  param("id").isInt({ gt: 0 }).withMessage("invalid enrollment id"),
  cancelEnrollmentById
);

router.post(
  "/:id/confirm-payment",
  requireAuth,
  param("id").isInt({ gt: 0 }).withMessage("invalid enrollment id"),
  confirmEnrollmentPayment
);

export default router;
