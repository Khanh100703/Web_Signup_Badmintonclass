import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  enroll,
  cancelEnrollment,
  adminList,
} from "../controllers/enrollmentsController.js";
import { body } from "express-validator";
import { myByClass } from "../controllers/enrollmentsController.js";

const router = Router();

router.get("/admin", requireAuth, requireRole("ADMIN"), adminList);
router.get("/my", requireAuth, myByClass);
router.post("/", requireAuth, body("session_id").notEmpty(), enroll);
router.delete("/:id", requireAuth, cancelEnrollment); // id_enrollments

export default router;
