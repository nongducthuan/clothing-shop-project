const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");
const NodeCache = require("node-cache");

// Init Cache: TTL (Time To Live) = 1 hour (3600s).
// Check for expired keys every 10 minutes (600s).
const recommendationCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });

/**
 * SERVICE: Spawns a Python child process to calculate item-based CF recommendations.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<number[]>} - A list of recommended product IDs.
 */
const getRecommendationsFromPython = (userId) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, "..", "recommender", "item_based_cf.py");
    // Ensure 'python' command matches your environment (python vs python3)
    const pyProg = spawn("python", [pythonScriptPath, userId]);

    let dataBuffer = "";
    let errorBuffer = "";

    // Collect data from stdout
    pyProg.stdout.on("data", (data) => {
      dataBuffer += data.toString();
    });

    // Collect errors from stderr
    pyProg.stderr.on("data", (data) => {
      errorBuffer += data.toString();
    });

    // Handle process exit
    pyProg.on("close", (code) => {
      if (code !== 0) {
        console.error(`[PYTHON ERROR] Exit code: ${code}, Error: ${errorBuffer}`);
        return resolve([]); // Return empty array to trigger fallback instead of crashing
      }

      try {
        // Parse the last line of the output to get the JSON result
        const lines = dataBuffer.trim().split("\n");
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch (e) {
        console.error("[JSON PARSE ERROR]", e.message);
        resolve([]); // Fallback on parse error
      }
    });
  });
};

/**
 * HELPER: Retrieves popular products (bestsellers) as a fallback mechanism.
 * Used when Python fails or for Cold Start users.
 * @param {number} limit - Number of products to retrieve.
 */
async function getFallbackProducts(limit = 6) {
  try {
    const [rows] = await db.query(
      `SELECT p.* FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       GROUP BY p.id
       ORDER BY SUM(oi.quantity) DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  } catch (error) {
    console.error("Fallback Query Error:", error);
    return [];
  }
}

/**
 * HELPER: Checks if the user has any interaction history.
 * Determines if we should use CF (Collaborative Filtering) or Popular Fallback.
 */
async function userHasHistory(userId) {
  const [rows] = await db.query(
    "SELECT 1 FROM user_product_interaction WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows.length > 0;
}

/* ============================================================
   MAIN ROUTE
   ============================================================ */
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    // 1. CHECK CACHE FIRST
    const cacheKey = `rec_${userId}`;
    const cachedData = recommendationCache.get(cacheKey);

    if (cachedData) {
        console.log(`[CACHE HIT] Returning cached data for User ${userId}`);
        return res.json(cachedData);
    }

    // 2. MAIN LOGIC
    let productIds = [];
    let responseType = "cf";

    const hasHistory = await userHasHistory(userId);

    if (!hasHistory) {
      // Handle Cold Start (New User) -> Return Popular Products
      const fallback = await getFallbackProducts();
      return res.json({ type: "popular", products: fallback });
    }

    // Invoke Python script for Item-Based CF
    console.log(`[PYTHON START] Calculating for User ${userId}...`);
    productIds = await getRecommendationsFromPython(userId);

    // If Python returns empty or fails -> Use Fallback
    if (!productIds || productIds.length === 0) {
        const fallback = await getFallbackProducts();
        return res.json({ type: "fallback_empty", products: fallback });
    }

    // 3. FETCH PRODUCT DETAILS FROM DB
    // Use placeholders (?) to prevent SQL Injection
    const placeholders = productIds.map(() => "?").join(",");
    const [products] = await db.query(
      `SELECT * FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    // Re-order products based on Python's similarity score (Database SELECT does not guarantee order)
    const sortedProducts = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((item) => item !== undefined);

    const responseData = {
      type: responseType,
      products: sortedProducts,
    };

    // 4. SAVE TO CACHE (Store result to avoid re-calculation for the next hour)
    recommendationCache.set(cacheKey, responseData);

    return res.json(responseData);

  } catch (error) {
    console.error("[SERVER ERROR]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
