import { Router } from "express";
import {
  listCategories,
  getCategory,
} from "../controllers/categoriesController.js";
const router = Router();
router.get("/", listCategories);
router.get("/:id", getCategory);
export default router;
