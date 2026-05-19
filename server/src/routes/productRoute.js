const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware"); 
const {
  getRepresentative,
  getProducts,
  getProductOptions,
  getProduct,
  searchProducts,
  logInteraction,
  getRecommendations,
} = require("../controllers/productController");

// ... Các route cũ giữ nguyên ...

// ✅ [MỚI] API để Frontend gọi khi bấm "Add to Cart"
// Yêu cầu user phải login mới log được hành vi này
router.post("/log-interaction", authenticateToken, logInteraction);
router.get("/representative", getRepresentative);
router.get("/search", searchProducts);
router.get("/", getProducts);
router.get("/recommendations/:userId", getRecommendations);
router.get("/:id/options", getProductOptions);
router.get("/:id", getProduct);

module.exports = router;
