import { Router } from "express";
import { body } from "express-validator";
import * as AuthExtraController from "../controllers/authExtraController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.post("/refresh", AuthExtraController.refresh);
router.post("/logout", requireAuth, AuthExtraController.logout);
router.post(
  "/request-change-password-otp",
  requireAuth,
  body("email").isEmail(),
  body("current_password").isLength({ min: 6 }),
  AuthExtraController.requestChangePasswordOtp
);
router.post(
  "/change-password-with-otp",
  requireAuth,
  body("email").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  body("new_password").isLength({ min: 8 }),
  AuthExtraController.changePasswordWithOtp
);
export default router;
