const pool = require("../db");

// =================== PRODUCTS ===================
async function getAllProducts() {
  const sql = `
    SELECT
      p.*,
      c.name AS category_name,
      COALESCE(SUM(ps.stock), 0) AS total_stock,
      (p.price - p.import_price) AS unit_profit
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_colors pc ON pc.product_id = p.id
    LEFT JOIN product_sizes ps ON ps.color_id = pc.id
    GROUP BY p.id, c.name
    ORDER BY p.id DESC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

async function createProduct(product) {
  const { name, description, price, import_price, image_url, gender, category_id } = product;
  const sql = `
    INSERT INTO products (name, description, price, import_price, image_url, gender, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [name, description || null, price, import_price || 0, image_url || null, gender || 'unisex', category_id]);
  return result.insertId;
}

async function updateProduct(id, product) {
  const { name, description, price, import_price, image_url, gender, category_id } = product;
  const sql = `
    UPDATE products
    SET name=?, description=?, price=?, import_price=?, image_url=?, gender=?, category_id=?
    WHERE id=?
  `;
  const [result] = await pool.query(sql, [name, description || null, price, import_price || 0, image_url || null, gender, category_id, id]);
  return result.affectedRows;
}

async function deleteProduct(id) {
  const [colors] = await pool.query("SELECT id FROM product_colors WHERE product_id=?", [id]);
  const colorIds = colors.map(c => c.id);
  if (colorIds.length > 0) {
    await pool.query(`DELETE FROM product_sizes WHERE color_id IN (?)`, [colorIds]);
    await pool.query(`DELETE FROM product_colors WHERE id IN (?)`, [colorIds]);
  }
  const [result] = await pool.query("DELETE FROM products WHERE id=?", [id]);
  return result.affectedRows;
}

async function getProductById(id) {
  const [products] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
  if (!products.length) return null;
  const product = products[0];
  const [colors] = await pool.query(`SELECT * FROM product_colors WHERE product_id = ?`, [id]);
  for (const color of colors) {
    const [sizes] = await pool.query(`SELECT * FROM product_sizes WHERE color_id = ?`, [color.id]);
    color.sizes = sizes;
  }
  product.colors = colors;
  return product;
}

async function getColorsByProduct(productId) {
  const [colors] = await pool.query("SELECT * FROM product_colors WHERE product_id = ?", [productId]);
  return colors;
}

async function createColor(productId, color) {
  const { color_name, color_code, image_url } = color;
  const [result] = await pool.query(
    "INSERT INTO product_colors (product_id, color_name, color_code, image_url) VALUES (?, ?, ?, ?)",
    [productId, color_name, color_code, image_url]
  );
  return result.insertId;
}

async function deleteColor(colorId) {
  await pool.query("DELETE FROM product_sizes WHERE color_id=?", [colorId]);
  const [result] = await pool.query("DELETE FROM product_colors WHERE id=?", [colorId]);
  return result.affectedRows;
}

async function addOrUpdateSize(colorId, sizeData) {
  const { size, stock, increment } = sizeData;

  // Kiểm tra size đã tồn tại
  const [existing] = await pool.query(
    "SELECT * FROM product_sizes WHERE color_id = ? AND size = ?",
    [colorId, size]
  );

  if (existing.length) {
    if (increment) {
      const [res] = await pool.query(
        "UPDATE product_sizes SET stock = stock + ? WHERE id = ?",
        [stock, existing[0].id]
      );
      return existing[0].id;
    } else {
      throw new Error("Size đã tồn tại");
    }
  } else {
    const [res] = await pool.query(
      "INSERT INTO product_sizes (color_id, size, stock) VALUES (?, ?, ?)",
      [colorId, size, stock]
    );
    return res.insertId;
  }
}

async function deleteSize(sizeId) {
  const [result] = await pool.query("DELETE FROM product_sizes WHERE id=?", [sizeId]);
  return result.affectedRows;
}

// =================== ORDERS & BANNERS ===================
async function getAllOrders() {
  const sql = `
    SELECT 
      o.*,
      COALESCE(u.name, o.name) AS user_name,
      u.email AS user_email,
      rr.reason_code,          -- Lấy mã lý do
      rr.description,          -- Lấy mô tả chi tiết trả hàng
      rr.refund_bank_info,     -- Lấy thông tin ngân hàng (JSON)
      rr.images AS return_images, -- Lấy ảnh bằng chứng (JSON)
      rr.status AS return_status
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN return_requests rr ON o.id = rr.order_id 
    ORDER BY o.created_at DESC
  `;
  const [orders] = await pool.query(sql);

  if (orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  const itemSql = `
      SELECT
        oi.*,
        p.name AS product_name,
        p.image_url,
        pc.color_name,
        ps.size
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_colors pc ON oi.color_id = pc.id
      LEFT JOIN product_sizes ps ON oi.size_id = ps.id
      WHERE oi.order_id IN (?)
  `;
  const [allItems] = await pool.query(itemSql, [orderIds]);

  return orders.map(order => {
    let bankInfo = null;
    let returnImages = [];

    try {
      if (order.refund_bank_info) {
        bankInfo = typeof order.refund_bank_info === 'string'
          ? JSON.parse(order.refund_bank_info)
          : order.refund_bank_info;
      }
      if (order.return_images) {
        returnImages = typeof order.return_images === 'string'
          ? JSON.parse(order.return_images)
          : order.return_images;
      }
    } catch (e) {
      console.error("Lỗi parse JSON trả hàng cho đơn:", order.id, e);
    }

    return {
      ...order,
      refund_bank_info: bankInfo,
      return_images: returnImages,
      items: allItems.filter(item => item.order_id === order.id)
    };
  });
}

async function updatePaymentStatus(orderId, paymentStatus) {
  const sql = "UPDATE orders SET payment_status = ? WHERE id = ?";
  const [result] = await pool.query(sql, [paymentStatus, orderId]);
  return result.affectedRows;
}

/* async function updateOrderStatus(orderId, status) {
  const sql = "UPDATE orders SET status = ? WHERE id = ?";
  const [result] = await pool.query(sql, [status, orderId]);
  return result.affectedRows;
} */

async function getAllBanners() {
  const [rows] = await pool.query("SELECT * FROM banners ORDER BY id DESC");
  return rows;
}

async function createBanner(banner) {
  const { image_url, title, subtitle } = banner;
  const sql = "INSERT INTO banners (image_url, title, subtitle) VALUES (?, ?, ?)";
  const [result] = await pool.query(sql, [image_url, title, subtitle]);
  return result.insertId;
}

async function updateBanner(id, banner) {
  const { image_url, title, subtitle } = banner;
  const sql = "UPDATE banners SET image_url=?, title=?, subtitle=? WHERE id=?";
  const [result] = await pool.query(sql, [image_url, title, subtitle, id]);
  return result.affectedRows;
}

async function deleteBanner(id) {
  const sql = "DELETE FROM banners WHERE id = ?";
  const [result] = await pool.query(sql, [id]);
  return result.affectedRows;
}

async function getAdminStats() {
  // 1. Lấy thông số tổng quát 
  const [summary] = await pool.query(`
    SELECT 
        -- === 7 NGÀY QUA ===
        COUNT(DISTINCT CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() THEN o.id END) AS weeklyOrders,
        SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity * oi.price ELSE 0 END) AS weeklyRevenue,
        SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() AND o.status = 'Delivered' THEN (oi.price - p.import_price) * oi.quantity ELSE 0 END) AS weeklyProfit,
        SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity ELSE 0 END) AS productsSoldWeek,

        -- === 30 NGÀY QUA ===
        COUNT(DISTINCT CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() THEN o.id END) AS monthlyOrders,
        SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity * oi.price ELSE 0 END) AS monthlyRevenue,
        SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() AND o.status = 'Delivered' THEN (oi.price - p.import_price) * oi.quantity ELSE 0 END) AS monthlyProfit,
        SUM(CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW() AND o.status = 'Delivered' THEN oi.quantity ELSE 0 END) AS productsSoldMonth
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
  `);

  // 2. Lấy dữ liệu 7 ngày gần nhất để vẽ biểu đồ 
  const [revenue7Days] = await pool.query(`
    SELECT 
        DATE(o.created_at) AS full_date,
        CASE DAYOFWEEK(o.created_at)
            WHEN 1 THEN CONCAT('CN (', DATE_FORMAT(o.created_at, '%d/%m'), ')') 
            WHEN 2 THEN CONCAT('T2 (', DATE_FORMAT(o.created_at, '%d/%m'), ')') 
            WHEN 3 THEN CONCAT('T3 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
            WHEN 4 THEN CONCAT('T4 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
            WHEN 5 THEN CONCAT('T5 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
            WHEN 6 THEN CONCAT('T6 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
            WHEN 7 THEN CONCAT('T7 (', DATE_FORMAT(o.created_at, '%d/%m'), ')')
        END AS day,
        SUM(oi.quantity * oi.price) AS revenue,
        SUM(oi.quantity * (oi.price - p.import_price)) AS profit
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND NOW()
      AND o.status = 'Delivered'
    GROUP BY full_date, day
    ORDER BY full_date ASC
    `);

  // 3. Trạng thái đơn hàng 
  const [orderStatus] = await pool.query(`
        SELECT status, COUNT(*) as quantity FROM orders GROUP BY status
    `);

  // 4. Doanh thu 12 tháng 
  const [revenueMonths] = await pool.query(`
    SELECT 
        DATE_FORMAT(m.month_date, '%m/%y') AS month_label,
        IFNULL(SUM(oi.quantity * oi.price), 0) AS revenue, 
        IFNULL(SUM(oi.quantity * (oi.price - p.import_price)), 0) AS profit
    FROM (
        SELECT DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL seq MONTH) AS month_date
        FROM (
            SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
            UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 
            UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
        ) AS sequences
    ) AS m
    LEFT JOIN orders o ON MONTH(o.created_at) = MONTH(m.month_date) 
        AND YEAR(o.created_at) = YEAR(m.month_date)
        AND o.status = 'Delivered'
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY m.month_date
    ORDER BY m.month_date ASC
  `);

  const [categoryStats] = await pool.query(`
        SELECT 
            c.name AS category_name,
            SUM(oi.quantity) AS total_sold,
            SUM(oi.quantity * oi.price) AS total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE o.status = 'Delivered' 
        GROUP BY c.name
        ORDER BY total_revenue DESC;
  `);

  const [returnReasons] = await pool.query(`
        SELECT 
            reason_code AS reason, 
            COUNT(*) AS quantity 
        FROM return_requests 
        GROUP BY reason_code
  `);

  const [returnStatus] = await pool.query(
    "SELECT status, COUNT(*) as quantity FROM return_requests GROUP BY status"
  );

  return {
    summary: summary[0],
    revenue7Days,
    orderStatus,
    revenueMonths,
    categoryStats,
    returnStatuses: returnStatus,
    returnReasons: returnReasons
  };
}

module.exports = {
  getAllProducts, createProduct, updateProduct, deleteProduct, getProductById,
  getColorsByProduct, createColor, deleteColor,
  addOrUpdateSize, deleteSize,
  getAllOrders,
  updatePaymentStatus,
  getAdminStats,
  getAllBanners, createBanner, updateBanner, deleteBanner
};
