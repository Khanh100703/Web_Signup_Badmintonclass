import { Router } from "express";
import * as AuthExtraController from "../controllers/authExtraController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.post("/refresh", AuthExtraController.refresh);
router.post("/logout", requireAuth, AuthExtraController.logout);
export default router;
