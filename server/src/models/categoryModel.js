// models/categoryModel.js
// Cleaned & documented category model

const db = require("../db");

/**
 * Lấy tất cả categories (không lọc preview) - dùng cho admin table
 */
async function getAllCategories() {
  const sql = `SELECT * FROM categories ORDER BY id ASC`;
  const [rows] = await db.query(sql);
  return rows;
}

/**
 * Lấy category theo id
 */
async function getCategoryById(id) {
  const sql = `SELECT * FROM categories WHERE id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [id]);
  return rows[0];
}

/**
 * Tạo category mới
 * data: { name, gender, image_url }
 */
async function createCategory(data) {
  const { name, gender, image_url = null } = data;
  const sql = `INSERT INTO categories (name, gender, image_url) VALUES (?, ?, ?)`;
  const [result] = await db.query(sql, [name, gender, image_url]);
  return result.insertId;
}

/**
 * Cập nhật category
 */
async function updateCategory(id, data) {
  const { name, gender, image_url = null } = data;
  const sql = `UPDATE categories SET name = ?, gender = ?, image_url = ? WHERE id = ?`;
  const [result] = await db.query(sql, [name, gender, image_url, id]);
  return result.affectedRows;
}

/**
 * Xóa category
 */
async function deleteCategory(id) {
  const sql = `DELETE FROM categories WHERE id = ?`;
  const [result] = await db.query(sql, [id]);
  return result.affectedRows;
}

/**
 * Lấy danh sách categories kèm preview_image (dùng cho navbar)
 * Logic preview:
 *  - Nếu categories.image_url tồn tại thì dùng
 *  - Ngược lại lấy ảnh đầu tiên có trong product_colors (ưu tiên)
 *  - Nếu không có product_colors, fallback lấy products.image_url
 *  - Lưu ý: chỉ return categories có ít nhất 1 product (cùng yêu cầu UI)
 */
async function getCategoriesWithPreview() {
  const sql = `
    SELECT
      c.id,
      c.name,
      c.description,
      c.gender,
      c.image_url,
      IF(
        c.image_url IS NOT NULL AND c.image_url <> '',
        c.image_url,
        COALESCE(
          (
            SELECT pc.image_url
            FROM products p
            LEFT JOIN product_colors pc ON pc.product_id = p.id
            WHERE p.category_id = c.id
              AND pc.image_url IS NOT NULL
            ORDER BY p.id ASC
            LIMIT 1
          ),
          (
            SELECT p.image_url
            FROM products p
            WHERE p.category_id = c.id
              AND p.image_url IS NOT NULL
            ORDER BY p.id ASC
            LIMIT 1
          )
        )
      ) AS preview_image
    FROM categories c
    WHERE EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
    ORDER BY c.id ASC;
  `;
  const [rows] = await db.query(sql);
  return rows;
}

/**
 * Lấy tất cả image_url từ product_colors cho 1 category
 * (dùng trong admin khi edit category để chọn ảnh đại diện)
 */
async function getCategoryImages(categoryId) {
  const sql = `
    SELECT DISTINCT pc.image_url
    FROM product_colors pc
    JOIN products p ON p.id = pc.product_id
    WHERE p.category_id = ?
      AND pc.image_url IS NOT NULL
  `;
  const [rows] = await db.query(sql, [categoryId]);
  return rows;
}

/**
 * Cập nhật image_url trong categories (set preview cố định)
 */
async function updateCategoryImage(categoryId, imageUrl) {
  const sql = `UPDATE categories SET image_url = ? WHERE id = ?`;
  const [result] = await db.query(sql, [imageUrl, categoryId]);
  return result.affectedRows;
}

/**
 * Gợi ý danh mục chưa có cho 1 giới tính (từ các danh mục khác)
 */
async function getRecommendCategoriesForGender(targetGender) {
  const sql = `
    SELECT DISTINCT name
    FROM categories
    WHERE gender <> ?
      AND name NOT IN (
        SELECT name FROM categories WHERE gender = ?
      )
    ORDER BY name ASC
  `;
  const [rows] = await db.query(sql, [targetGender, targetGender]);
  return rows;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithPreview,
  getCategoryImages,
  updateCategoryImage,
  getRecommendCategoriesForGender,
};
