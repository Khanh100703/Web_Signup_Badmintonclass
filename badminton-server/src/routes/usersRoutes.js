import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  verifyRegisterOtp,
  resendRegisterOtp,
} from "../controllers/usersController.js";
import { requireAuth } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

// badminton-server/src/routes/usersRoutes.js
router.post(
  "/register",
  body("name").isLength({ min: 2 }).withMessage("Tên tối thiểu 2 ký tự"),
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu tối thiểu 8 ký tự")
    .matches(/(?=.*[a-z])/)
    .withMessage("Cần có ít nhất 1 chữ thường")
    .matches(/(?=.*[A-Z])/)
    .withMessage("Cần có ít nhất 1 chữ hoa")
    .matches(/(?=.*\d)/)
    .withMessage("Cần có ít nhất 1 chữ số") // <- 1 dấu \
    .matches(/(?=.*[^\w\s])/)
    .withMessage("Cần có ít nhất 1 ký tự đặc biệt"), // <- 1 dấu \
  registerUser
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  loginUser
);

router.post(
  "/verify-register-otp",
  body("email").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }),
  verifyRegisterOtp
);

router.post("/resend-register-otp", body("email").isEmail(), resendRegisterOtp);

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
