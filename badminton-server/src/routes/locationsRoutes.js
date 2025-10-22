import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import * as LocationsController from "../controllers/locationsController.js";

const router = Router();
router.get("/", LocationsController.list);
router.get("/:id", LocationsController.detail);

router.post("/", requireAuth, requireRole("ADMIN"), LocationsController.create);
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  LocationsController.update
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  LocationsController.remove
);

export default router;
