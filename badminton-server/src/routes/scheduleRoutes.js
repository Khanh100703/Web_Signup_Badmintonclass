import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { mySchedule } from "../controllers/scheduleController.js";

const router = Router();
router.get("/me/schedule", requireAuth, mySchedule);
export default router;
