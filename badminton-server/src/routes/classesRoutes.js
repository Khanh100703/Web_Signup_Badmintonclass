import { Router } from "express";
import {
  listClasses,
  createClass,
  getClassDetail,
  updateClass,
  deleteClass,
} from "../controllers/classesController.js";
import { auth, requireRole } from "../middlewares/auth.js";
import { body } from "express-validator";

const router = Router();

router.get("/", listClasses);
router.get("/:id", getClassDetail);

// Admin CRUD
router.post(
  "/",
  auth,
  requireRole(["ADMIN"]),
  body("title").notEmpty(),
  body("coach_id").notEmpty(),
  createClass
);

router.put("/:id", auth, requireRole(["ADMIN"]), updateClass);
router.delete("/:id", auth, requireRole(["ADMIN"]), deleteClass);

export default router;
