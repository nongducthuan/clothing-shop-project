const pool = require('../db');

/**
 * Lấy chi tiết sản phẩm bao gồm:
 * - Thông tin sản phẩm chính (Đã bỏ stock, thêm gender)
 * - Danh sách màu
 * - Danh sách size
 */
async function getProductDetails(productId) {
  // 1. Lấy thông tin sản phẩm chính
  const [productRows] = await pool.query(`
    SELECT
      p.id, p.name, p.description, p.price,
      p.image_url, p.gender,
      c.name AS category_name,
      COALESCE((
        SELECT MAX(s.discount_percent)
        FROM sales s
        LEFT JOIN product_sales ps ON s.id = ps.sale_id
        LEFT JOIN sale_categories sc ON s.id = sc.sale_id
        WHERE s.status = 1 
          AND NOW() BETWEEN s.start_date AND s.end_date
          AND (
            s.apply_scope = 'all'
            OR (s.apply_scope = 'product' AND ps.product_id = p.id)
            OR (s.apply_scope = 'category' AND sc.category_id = p.category_id)
          )
      ), 0) as sale_percent
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `, [productId]);

  if (productRows.length === 0) return null;

  const product = productRows[0];

  // 2. Lấy danh sách màu
  const [colorRows] = await pool.query(
    'SELECT id AS color_id, color_name, color_code, image_url FROM product_colors WHERE product_id = ?',
    [productId]
  );

  // 3. Lấy danh sách size cho từng màu (Dùng Promise.all để chạy song song -> Nhanh hơn)
  await Promise.all(colorRows.map(async (color) => {
    const [sizeRows] = await pool.query(
      'SELECT id AS size_id, size, stock FROM product_sizes WHERE color_id = ?',
      [color.color_id]
    );
    color.sizes = sizeRows;
  }));

  // 4. Tính tổng tồn kho (Optional - Để hiển thị tổng số lượng nếu cần)
  const totalStock = colorRows.reduce((acc, color) => {
    return acc + color.sizes.reduce((sum, size) => sum + size.stock, 0);
  }, 0);

  return {
    ...product,
    total_stock: totalStock, // Trả thêm cái này cho tiện hiển thị
    colors: colorRows,
  };
}

module.exports = { getProductDetails };
