// controllers/categoryController.js
const categoryModel = require("../models/categoryModel");

/**
 * GET /categories
 * Retrieves all categories (admin table)
 */
async function getCategories(req, res) {
  try {
    const categories = await categoryModel.getAllCategories();
    res.status(200).json({ data: categories });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Error fetching categories" }); // Changed
  }
}

/**
 * GET /categories/recommend?gender=...
 * Suggests categories not yet linked to a specific gender
 */
async function getRecommendCategories(req, res) {
  try {
    const gender = req.query.gender;
    if (!gender) return res.status(400).json({ message: "Missing gender" }); // Changed

    const result = await categoryModel.getRecommendCategoriesForGender(gender);
    res.json({ data: result });
  } catch (err) {
    console.error("getRecommendCategories error:", err);
    res.status(500).json({ message: "Error fetching recommended categories" }); // Changed
  }
}

/**
 * GET /categories/with-preview
 * Retrieves categories (for navbar) including preview_image
 */
async function getCategoriesWithPreview(req, res) {
  try {
    const rows = await categoryModel.getCategoriesWithPreview();
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error("getCategoriesWithPreview error:", err);
    res.status(500).json({ message: "Error fetching categories with preview" }); // Changed
  }
}

/**
 * POST /categories  (admin)
 */
async function createCategory(req, res) {
  try {
    const id = await categoryModel.createCategory(req.body);
    res.status(201).json({ message: "Successfully created", id }); // Changed
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ message: "Error adding category" }); // Changed
  }
}

/**
 * PUT /categories/:id  (admin)
 */
async function updateCategory(req, res) {
  try {
    const rows = await categoryModel.updateCategory(req.params.id, req.body);
    if (rows === 0) return res.status(404).json({ message: "Category not found" }); // Changed
    res.json({ message: "Successfully updated" }); // Changed
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ message: "Error updating category" }); // Changed
  }
}

/**
 * DELETE /categories/:id  (admin)
 */
async function deleteCategory(req, res) {
  try {
    const rows = await categoryModel.deleteCategory(req.params.id);
    if (rows === 0) return res.status(404).json({ message: "Category not found" }); // Changed
    res.json({ message: "Successfully deleted" }); // Changed
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: "Error deleting category" }); // Changed
  }
}

/**
 * GET /categories/:id/images
 * Retrieves a list of related images to select a representative image during edit
 */
async function getCategoryImages(req, res) {
  try {
    const images = await categoryModel.getCategoryImages(req.params.id);
    res.json({ data: images });
  } catch (err) {
    console.error("getCategoryImages error:", err);
    res.status(500).json({ message: "Error fetching category images" }); // Changed
  }
}

module.exports = {
  getCategories,
  getRecommendCategories,
  getCategoriesWithPreview,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryImages,
};