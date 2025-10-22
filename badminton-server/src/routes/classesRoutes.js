import { Router } from "express";
import {
  listClasses,
  createClass,
  getClassDetail,
  updateClass,
  deleteClass,
} from "../controllers/classesController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

router.get("/", listClasses);
router.get("/:id", getClassDetail);

// Admin CRUD
router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  body("title").notEmpty(),
  body("coach_id").notEmpty(),
  createClass
);

router.put("/:id", requireAuth, requireRole(["ADMIN"]), updateClass);
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), deleteClass);

export default router;
