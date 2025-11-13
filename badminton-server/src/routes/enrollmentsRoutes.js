import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { body, query, param } from "express-validator";
import {
  enrollClass,
  myEnrollments,
  cancelEnrollmentById,
} from "../controllers/enrollmentsController.js";

const router = Router();

// Danh sách đơn của tôi (theo lớp)
router.get("/my", requireAuth, myEnrollments);

// Đăng ký theo LỚP
router.post(
  "/",
  requireAuth,
  body("class_id").isInt({ gt: 0 }).withMessage("class_id is required"),
  body("note").optional().isString().isLength({ max: 255 }),
  enrollClass
);

// Huỷ theo ID của enrollment
router.delete(
  "/:id",
  requireAuth,
  param("id").isInt({ gt: 0 }).withMessage("invalid enrollment id"),
  cancelEnrollmentById
);

export default router;
