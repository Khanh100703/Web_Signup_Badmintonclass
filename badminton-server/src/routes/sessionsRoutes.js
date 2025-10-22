import { Router } from "express";
import {
  listSessionsByClass,
  createSession,
  updateSession,
  deleteSession,
} from "../controllers/sessionsController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

router.get("/class/:classId", listSessionsByClass);

router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  body("class_id").notEmpty(),
  body("start_time").notEmpty(),
  body("end_time").notEmpty(),
  createSession
);

router.put("/:id", requireAuth, requireRole(["ADMIN"]), updateSession);
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), deleteSession);

export default router;
