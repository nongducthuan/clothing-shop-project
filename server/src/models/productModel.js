const db = require("../db");

// --- HÀM PHỤ TRỢ: TẠO ĐIỀU KIỆN LỌC GIỚI TÍNH (STRICT) ---
const getGenderCondition = (gender) => {
    if (!gender || gender === "") return { sql: "", params: [] };
    // CHỈ LẤY ĐÚNG GIỚI TÍNH ĐÓ, KHÔNG TRỘN UNISEX
    return { sql: " AND p.gender = ?", params: [gender] };
};

// 1. Lấy tất cả sản phẩm
async function getAllProducts(categoryId, gender, limit, offset) {
    let sql = `
    SELECT
    p.*,

    -- 1. Subquery tính % giảm giá (Code cũ của bạn giữ nguyên)
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
    ), 0) as sale_percent,

    -- 2. ĐÂY LÀ PHẦN THÊM VÀO ĐỂ LẤY STOCK: Subquery tính tổng tồn kho
    COALESCE((
        SELECT SUM(psize.stock)
        FROM product_colors pcolor
        JOIN product_sizes psize ON pcolor.id = psize.color_id
        WHERE pcolor.product_id = p.id
    ), 0) as total_stock

    FROM products p
    WHERE 1=1
  `;
    const params = [];

    if (categoryId) {
        sql += " AND p.category_id = ?";
        params.push(categoryId);
    }

    const genderCond = getGenderCondition(gender);
    sql += genderCond.sql;
    params.push(...genderCond.params);

    sql += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(sql, params);
    return rows;
}

// 2. Đếm tổng sản phẩm (Phân trang)
async function countProducts(categoryId, gender) {
    let sql = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
    const params = [];

    if (categoryId) {
        sql += " AND p.category_id = ?";
        params.push(categoryId);
    }

    const genderCond = getGenderCondition(gender);
    sql += genderCond.sql;
    params.push(...genderCond.params);

    const [rows] = await db.query(sql, params);
    return rows[0].total;
}

// 3. Tìm kiếm sản phẩm
async function searchProductsInModel(keyword, gender, categoryId, limit, offset) {
    let sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE (p.name LIKE ? OR p.description LIKE ?)
  `;
    const searchTerm = `%${keyword}%`;
    const params = [searchTerm, searchTerm];

    if (categoryId) {
        sql += " AND p.category_id = ?";
        params.push(categoryId);
    }

    const genderCond = getGenderCondition(gender);
    sql += genderCond.sql;
    params.push(...genderCond.params);

    sql += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(sql, params);
    return rows;
}

// 4. Đếm kết quả tìm kiếm
async function countSearchedProducts(keyword, gender, categoryId) {
    let sql = `
    SELECT COUNT(*) as total
    FROM products p
    WHERE (p.name LIKE ? OR p.description LIKE ?)
  `;
    const searchTerm = `%${keyword}%`;
    const params = [searchTerm, searchTerm];

    if (categoryId) {
        sql += " AND p.category_id = ?";
        params.push(categoryId);
    }

    const genderCond = getGenderCondition(gender);
    sql += genderCond.sql;
    params.push(...genderCond.params);

    const [rows] = await db.query(sql, params);
    return rows[0].total;
}

// 5. Lấy chi tiết sản phẩm
async function getProductById(id) {
    const sql = `
    SELECT
      p.*,
      c.name as category_name,
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
  `;

    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) return null;

    const product = rows[0];

    // Ép kiểu số cho an toàn
    product.sale_percent = parseFloat(product.sale_percent || 0);
    product.price = parseFloat(product.price);

    const sqlColors = "SELECT * FROM product_colors WHERE product_id = ?";
    const [colors] = await db.query(sqlColors, [id]);

    for (const color of colors) {
        const sqlSizes = "SELECT * FROM product_sizes WHERE color_id = ?";
        const [sizes] = await db.query(sqlSizes, [color.id]);
        color.sizes = sizes;
    }

    product.colors = colors;
    return product;
}

// 6. Lấy sản phẩm đại diện
async function getRepresentativeProduct(categoryId) {
    const sql = "SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC LIMIT 1";
    const [rows] = await db.query(sql, [categoryId]);
    return rows[0];
}

module.exports = {
    getAllProducts,
    countProducts,
    getProductById,
    getRepresentativeProduct,
    searchProductsInModel,
    countSearchedProducts
};
