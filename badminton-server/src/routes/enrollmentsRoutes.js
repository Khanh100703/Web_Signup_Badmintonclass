import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  enroll,
  cancelEnrollment,
  myByClass,
  listAll,
  updateStatus,
} from "../controllers/enrollmentsController.js";
import { body } from "express-validator";

const router = Router();

router.get("/", requireAuth, requireRole(["ADMIN"]), listAll);
router.get("/my", requireAuth, myByClass);
router.post("/", requireAuth, body("session_id").notEmpty(), enroll);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(["ADMIN"]),
  body("status").isIn(["ENROLLED", "CANCELLED", "WAITLIST"]),
  updateStatus
);
router.delete("/:id", requireAuth, cancelEnrollment); // id_enrollments

export default router;
