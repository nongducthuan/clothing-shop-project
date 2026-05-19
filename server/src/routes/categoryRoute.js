// routes/categoryRoute.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

// Public
router.get("/", categoryController.getCategories);
router.get("/recommend", categoryController.getRecommendCategories);
router.get("/with-preview", categoryController.getCategoriesWithPreview);
router.get("/:id/images", categoryController.getCategoryImages);

// Admin
router.post("/", authenticateToken, requireAdmin, categoryController.createCategory);
router.put("/:id", authenticateToken, requireAdmin, categoryController.updateCategory);
router.delete("/:id", authenticateToken, requireAdmin, categoryController.deleteCategory);

module.exports = router;
