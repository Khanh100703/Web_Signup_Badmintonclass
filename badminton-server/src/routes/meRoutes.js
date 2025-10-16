import { Router } from "express";
import {
  getMe,
  updateMe,
  getMySchedule,
} from "../controllers/usersController.js";

const router = Router();

router.get("/", getMe);
router.put("/", updateMe);
router.get("/schedule", getMySchedule);

export default router;
