import { Router } from "express";
import { listLevels, getLevel } from "../controllers/levelsController.js";
const router = Router();
router.get("/", listLevels);
router.get("/:id", getLevel);
export default router;
