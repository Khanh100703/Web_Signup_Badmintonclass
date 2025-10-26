import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} from "../controllers/usersController.js";
import { requireAuth } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

router.post(
  "/register",
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  registerUser
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  loginUser
);

router.get("/me", requireAuth, getMe);
router.put(
  "/me",
  requireAuth,
  body("name").optional().isString(),
  body("phone").optional().isString(),
  updateMe
);
// Quên mật khẩu: gửi OTP về email (hoặc trả về dev_otp nếu chưa cấu hình SMTP)
router.post("/forgot-password", body("email").isEmail(), forgotPassword);

// Reset mật khẩu: xác thực OTP, tạo mật khẩu mới, gửi cho user
router.post(
  "/reset-password",
  body("email").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  resetPassword
);
export default router;
