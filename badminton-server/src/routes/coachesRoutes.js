import { Router } from "express";
import { listCoaches } from "../controllers/coachesController.js";

const router = Router();

router.get("/", listCoaches);

export default router;
