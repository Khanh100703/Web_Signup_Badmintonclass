import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import * as AttendanceController from "../controllers/attendanceController.js";

const router = Router();
router.post(
  "/sessions/:sessionId/attendance",
  requireAuth,
  requireRole(["COACH", "ADMIN"]),
  AttendanceController.mark
);
router.get(
  "/sessions/:sessionId/attendance",
  requireAuth,
  requireRole(["COACH", "ADMIN"]),
  AttendanceController.list
);
export default router;
