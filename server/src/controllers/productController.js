const productModel = require("../models/productModel");
const { recordInteraction } = require("../services/interactionService");

/* ============================================================
    GET REPRESENTATIVE PRODUCT FOR CATEGORY
    ============================================================ */
async function getRepresentative(req, res) {
  const { category_id } = req.query;
  if (!category_id)
    return res.status(400).json({ message: "Missing category_id" }); // Changed

  try {
    const product = await productModel.getRepresentativeProduct(category_id);
    if (!product) return res.status(404).json({ message: "Product not found" }); // Changed

    res.json(product);
  } catch (err) {
    console.error("❌ Error getRepresentative:", err);
    res.status(500).json({ message: "Server error" }); // Changed
  }
}

/* ============================================================
    GET PRODUCT LIST (CategoryPage)
    Supports filter: category_id + gender + pagination
    ============================================================ */
async function getProducts(req, res) {
  try {
    const { category_id, gender, page = 1, limit = 8 } = req.query;

    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;

    const products = await productModel.getAllProducts(
      category_id,
      gender,
      l,
      offset,
    );

    const totalProducts = await productModel.countProducts(category_id, gender);

    const totalPages = Math.ceil(totalProducts / l);

    res.json({
      data: products,
      products,
      totalPages,
      currentPage: p,
      totalProducts,
    });
  } catch (err) {
    console.error("❌ Error getProducts:", err);
    res
      .status(500)
      .json({ message: "Server error when fetching product list" }); // Changed
  }
}

/* ============================================================
    SEARCH PRODUCTS
    ============================================================ */
async function searchProducts(req, res) {
  try {
    const { q, gender, category, page = 1, limit = 8 } = req.query;

    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;

    const products = await productModel.searchProductsInModel(
      q,
      gender,
      category,
      l,
      offset,
    );

    const totalProducts = await productModel.countSearchedProducts(
      q,
      gender,
      category,
    );

    const totalPages = Math.ceil(totalProducts / l);

    res.json({
      data: products,
      products,
      totalPages,
      currentPage: p,
      totalProducts,
    });
  } catch (err) {
    console.error("❌ Error searchProducts:", err);
    res.status(500).json({ message: "Server error during search" }); // Changed
  }
}

/* ============================================================
    GET SINGLE PRODUCT DETAIL (LOGIC VIEW)
    ============================================================ */
async function getProduct(req, res) {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin sản phẩm từ DB
    const product = await productModel.getProductById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. [MỚI] GHI NHẬN VIEW NẾU CÓ USER ID
    // userId có thể đến từ Token (req.user.id) hoặc từ URL (req.query.userId)
    // (Do lúc nãy ta đã sửa Frontend để gửi kèm ?userId=...)
    const userId = req.user?.id || req.query.userId;

    if (userId) {
      // Gọi service để lưu vào bảng user_product_interaction
      // Số 1 = VIEW (như trong DB quy ước)
      recordInteraction(userId, id, "view").catch((err) =>
        console.error("⚠️ Failed to log view:", err.message),
      );
      console.log(`👁️ User ${userId} viewed Product ${id}`);
    }

    // 3. Trả về dữ liệu sản phẩm
    res.json(product);
  } catch (err) {
    console.error("❌ Error getProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/* ============================================================
    LOG INTERACTION (CHO ACTION ADD_TO_CART)
   ============================================================ */
async function logInteraction(req, res) {
  try {
    const userId = req.user.id; // Lấy từ token
    const { productId, type } = req.body;

    if (type === "add_to_cart") {
      await recordInteraction(userId, productId, "add_to_cart");
    }

    res.status(200).json({ message: "Interaction recorded" });
  } catch (err) {
    console.error("Log error:", err);
    res.status(500).json({ message: "Error logging interaction" });
  }
}

/* ============================================================
    GET PRODUCT OPTIONS (SIZE/STOCK) LIST
    ============================================================ */
async function getProductOptions(req, res) {
  try {
    const { id } = req.params;

    const options = await productModel.getProductOptionsById(id);
    res.json(options);
  } catch (err) {
    console.error("❌ Error getProductOptions:", err);
    res.status(500).json({ message: "Server error" }); // Changed
  }
}

/* ============================================================
    GET RECOMMENDATIONS (HYBRID: AI + RANDOM FILL)
    Mục tiêu: Luôn hiển thị đủ 8 sản phẩm
   ============================================================ */
// Thay thế hàm getRecommendations cũ bằng hàm này
async function getRecommendations(req, res) {
  try {
    let { userId } = req.params;
    const TARGET_SIZE = 8;
    let finalProducts = [];
    let excludeIds = [];

    // 🛡️ CHỐT CHẶN AN TOÀN:
    // Nếu là "guest" hoặc "null", coi như không có user -> Bỏ qua bước tìm kiếm AI
    const isGuest = !userId || userId === 'guest' || userId === 'null' || userId === 'undefined';

    // ---------------------------------------------------------
    // BƯỚC 1: CHỈ CHẠY LOGIC GỢI Ý NẾU LÀ USER THẬT
    // ---------------------------------------------------------
    if (!isGuest) {
      try {
        const sqlRecs = `
          SELECT DISTINCT p.* FROM products p
          JOIN user_product_interaction upi ON p.id = upi.product_id
          WHERE upi.user_id IN (
              SELECT DISTINCT t2.user_id
              FROM user_product_interaction t1
              JOIN user_product_interaction t2 ON t1.product_id = t2.product_id
              WHERE t1.user_id = ? AND t2.user_id != ?
          )
          AND p.id NOT IN (
              SELECT product_id FROM user_product_interaction
              WHERE user_id = ? AND interaction_type = 'purchase'
          )
          LIMIT ?;
        `;
        // Chú ý: Đảm bảo bạn đã import db hoặc dùng productModel.db
        const [recs] = await productModel.db.query(sqlRecs, [userId, userId, userId, TARGET_SIZE]);
        finalProducts = recs;
        excludeIds = finalProducts.map(p => p.id);
      } catch (err) {
        console.warn("⚠️ User chưa có lịch sử, chuyển sang random.");
      }
    }

    // ---------------------------------------------------------
    // BƯỚC 2: USER LÀ GUEST HOẶC THIẾU SỐ LƯỢNG -> LẤY RANDOM
    // ---------------------------------------------------------
    if (finalProducts.length < TARGET_SIZE) {
      const missingCount = TARGET_SIZE - finalProducts.length;
      let sqlRandom = "SELECT * FROM products";

      if (excludeIds.length > 0) {
        sqlRandom += ` WHERE id NOT IN (${excludeIds.join(',')})`;
      }

      sqlRandom += " ORDER BY RAND() LIMIT ?";

      const [randomProducts] = await productModel.db.query(sqlRandom, [missingCount]);
      finalProducts = [...finalProducts, ...randomProducts];
    }

    res.json(finalProducts);

  } catch (err) {
    console.error("❌ Error getRecommendations:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/* ============================================================
    EXPORT CONTROLLER
    ============================================================ */
module.exports = {
  getRepresentative,
  getProducts,
  searchProducts,
  getProduct,
  getProductOptions,
  logInteraction,
  getRecommendations,
};
