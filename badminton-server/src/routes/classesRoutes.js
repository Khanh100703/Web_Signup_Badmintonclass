import { Router } from "express";
import { listClasses, createClass } from "../controllers/classesController.js";
const router = Router();

router.get("/", listClasses); // GET /api/classes
router.post("/", createClass); // POST /api/classes

export default router;
