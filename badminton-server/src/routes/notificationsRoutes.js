import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as NotificationsController from "../controllers/notificationsController.js";

const router = Router();
router.get("/me/notifications", requireAuth, NotificationsController.myList);
router.post(
  "/me/notifications/read",
  requireAuth,
  NotificationsController.markRead
);
export default router;
