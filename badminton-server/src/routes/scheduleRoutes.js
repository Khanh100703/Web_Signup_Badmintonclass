import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { mySchedule } from "../controllers/scheduleController.js";

const router = Router();
router.get("/me/schedule", auth, mySchedule);
export default router;
