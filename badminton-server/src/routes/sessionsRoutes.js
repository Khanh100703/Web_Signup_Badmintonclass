import { Router } from "express";
import {
  listSessionsByClass,
  createSession,
} from "../controllers/sessionsController.js";
import {
  authMiddleware,
  requireAdmin,
} from "../middlewares/authMiddleware.js";
const router = Router();

router.get("/class/:classId", listSessionsByClass); // GET /api/sessions/class/1
router.post("/", authMiddleware, requireAdmin, createSession);

export default router;
