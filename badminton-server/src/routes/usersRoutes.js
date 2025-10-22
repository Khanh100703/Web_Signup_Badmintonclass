import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
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

export default router;
