import { Router } from "express";
import {
  listSessionsByClass,
  createSession,
  updateSession,
  deleteSession,
} from "../controllers/sessionsController.js";
import { auth, requireRole } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

router.get("/class/:classId", listSessionsByClass);

router.post(
  "/",
  auth,
  requireRole(["ADMIN"]),
  body("class_id").notEmpty(),
  body("start_time").notEmpty(),
  body("end_time").notEmpty(),
  createSession
);

router.put("/:id", auth, requireRole(["ADMIN"]), updateSession);
router.delete("/:id", auth, requireRole(["ADMIN"]), deleteSession);

export default router;
