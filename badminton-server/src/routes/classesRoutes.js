import { Router } from "express";
import {
  listClasses,
  getClassDetail,
  createClass,
} from "../controllers/classesController.js";
import {
  authMiddleware,
  requireAdmin,
} from "../middlewares/authMiddleware.js";
const router = Router();

router.get("/", listClasses); // GET /api/classes
router.get("/:id", getClassDetail); // GET /api/classes/:id
router.post("/", authMiddleware, requireAdmin, createClass);

export default router;
