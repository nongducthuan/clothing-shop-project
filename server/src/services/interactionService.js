const pool = require("../db");

async function recordInteraction(userId, productId, type) {
  // type: 'view', 'add_to_cart', 'purchase'
  if (!userId || !productId || !type) return;

  try {
    if (type === 'view') {
      const [existingViews] = await pool.query(
        `SELECT id FROM user_product_interaction
         WHERE user_id = ?
         AND product_id = ?
         AND interaction_type = 'view'
         AND created_at >= NOW() - INTERVAL 5 MINUTE`,
        [userId, productId]
      );

      if (existingViews.length > 0) {
        return;
      }
    }

    // =========================================================
    // ✅ GHI DỮ LIỆU MỚI
    // =========================================================
    await pool.query(
      `INSERT INTO user_product_interaction (user_id, product_id, interaction_type)
       VALUES (?, ?, ?)`,
      [userId, productId, type]
    );

  } catch (err) {
    console.error("Interaction log error:", err.message);
  }
}

module.exports = { recordInteraction };
