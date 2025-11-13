// src/routes/reportsRoutes.js
import { Router } from "express";
import { getSummary } from "../controllers/reportsController.js";

const router = Router();
router.get("/summary", getSummary);
export default router;
