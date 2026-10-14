import { Router } from "express";
import { createCategory, deleteCategory, getCategories } from "../controllers/categoryController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const categoryRouter = Router()

// Public / customer can view categories
categoryRouter.get("/", getCategories)

// Merchant can manage categories
categoryRouter.post("/", requireAuth, requireRole(['merchant']), createCategory)
categoryRouter.delete("/:id", requireAuth, requireRole(['merchant']), deleteCategory)

export default categoryRouter;