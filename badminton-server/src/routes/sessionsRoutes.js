import { Router } from "express";
import {
  listSessionsByClass,
  createSession,
  updateSession,
  deleteSession,
  notifyParticipants,
  registerForSession,
  mySessionBookingsByClass,
} from "../controllers/sessionsController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

router.get("/class/:classId", listSessionsByClass);
router.get(
  "/class/:classId/my-bookings",
  requireAuth,
  mySessionBookingsByClass
);

router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  body("class_id").notEmpty(),
  body("start_time").notEmpty(),
  body("end_time").notEmpty(),
  createSession
);

router.post(
  "/:id/notify",
  requireAuth,
  requireRole(["ADMIN", "COACH"]),
  notifyParticipants
);

router.post("/:id/book", requireAuth, registerForSession);

router.put("/:id", requireAuth, requireRole(["ADMIN"]), updateSession);
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), deleteSession);

export default router;
