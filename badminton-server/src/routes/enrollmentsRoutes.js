import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  enroll,
  cancelEnrollment,
} from "../controllers/enrollmentsController.js";
import { body } from "express-validator";

const router = Router();

router.post("/", requireAuth, body("session_id").notEmpty(), enroll);
router.delete("/:id", requireAuth, cancelEnrollment); // id_enrollments

export default router;
