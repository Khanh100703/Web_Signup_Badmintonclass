import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import * as AdminUsersController from "../controllers/adminUsersController.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", AdminUsersController.listUsers);
router.patch("/:id/lock", AdminUsersController.lockUser);
router.patch("/:id/unlock", AdminUsersController.unlockUser);
router.patch("/:id/role", AdminUsersController.changeRole);

export default router;
