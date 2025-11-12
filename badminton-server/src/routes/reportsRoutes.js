import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import * as ReportsController from "../controllers/reportsController.js";

const router = Router();
router.use(requireAuth, requireRole(["ADMIN"]));

router.get("/summary", ReportsController.summary); // ?by=coach|class|location&from=&to=
router.get("/export.csv", ReportsController.exportCsv);
export default router;
