import { Router } from "express";
import {
  createEnrollment,
  cancelEnrollment,
} from "../controllers/enrollmentsController.js";

const router = Router();

router.post("/", createEnrollment);
router.delete("/:id", cancelEnrollment);

export default router;
