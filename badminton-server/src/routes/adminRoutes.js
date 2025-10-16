import { Router } from "express";
import {
  listUsers,
  updateUserRole,
  updateUserLock,
} from "../controllers/adminController.js";

const router = Router();

router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/lock", updateUserLock);

export default router;
