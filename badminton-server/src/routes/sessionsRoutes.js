import { Router } from "express";
import {
  listSessionsByClass,
  createSession,
} from "../controllers/sessionsController.js";
const router = Router();

router.get("/class/:classId", listSessionsByClass); // GET /api/sessions/class/1
router.post("/", createSession); // POST /api/sessions

export default router;
