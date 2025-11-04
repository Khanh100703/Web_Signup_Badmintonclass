import { Router } from "express";
import { body } from "express-validator";
import {
  submitContact,
  listContacts,
  updateContactStatus,
} from "../controllers/contactsController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Khách gửi liên hệ
router.post(
  "/contacts",
  body("name").isLength({ min: 2 }),
  body("email").isEmail(),
  body("message").isLength({ min: 5 }),
  submitContact
);

// Admin xem & cập nhật trạng thái
router.get("/contacts", requireAuth, listContacts);
router.patch(
  "/contacts/:id/status",
  requireAuth,
  body("status").isIn(["NEW", "SEEN", "DONE"]),
  updateContactStatus
);

export default router;
