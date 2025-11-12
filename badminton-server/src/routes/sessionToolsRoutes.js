import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import * as SessionToolsController from "../controllers/sessionToolsController.js";

const router = Router();
router.post(
  "/classes/:classId/generate-sessions",
  requireAuth,
  requireRole("ADMIN"),
  SessionToolsController.generateSessions
);
export default router;
