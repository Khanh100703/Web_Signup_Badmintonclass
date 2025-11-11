import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import * as CoachesController from "../controllers/coachesController.js";

const router = Router();

// Public
router.get("/", CoachesController.list);
router.get("/:id", CoachesController.detail);

// Admin CRUD
router.post("/", requireAuth, requireRole("ADMIN"), CoachesController.create);
router.put("/:id", requireAuth, requireRole("ADMIN"), CoachesController.update);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  CoachesController.remove
);

// Availability (COACH hoặc ADMIN)
router.get("/:id/availabilities", CoachesController.listAvailabilities);
router.post(
  "/:id/availabilities",
  requireAuth,
  requireRole(["COACH", "ADMIN"]),
  CoachesController.addAvailability
);
// Chú ý param phải là :availId như controller
router.delete(
  "/:id/availabilities/:availId",
  requireAuth,
  requireRole(["COACH", "ADMIN"]),
  CoachesController.removeAvailability
);

// Blackout dates (COACH hoặc ADMIN)
router.get("/:id/blackouts", CoachesController.listBlackouts);
router.post(
  "/:id/blackouts",
  requireAuth,
  requireRole(["COACH", "ADMIN"]),
  CoachesController.addBlackout
);
// Chú ý param phải là :bid như controller
router.delete(
  "/:id/blackouts/:bid",
  requireAuth,
  requireRole(["COACH", "ADMIN"]),
  CoachesController.removeBlackout
);

export default router;
