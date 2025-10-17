import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import {
  enroll,
  cancelEnrollment,
} from "../controllers/enrollmentsController.js";
import { body } from "express-validator";

const router = Router();

router.post("/", auth, body("session_id").notEmpty(), enroll);
router.delete("/:id", auth, cancelEnrollment); // id_enrollments

export default router;
