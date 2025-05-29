// backend/controllers/categoryController.js
const Category = require('../models/categoryModel');

async function getAllCategories(req, res) {
    try {
        const categories = Category.getAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tải danh mục: " + error.message });
    }
}

async function createCategory(req, res) {
    try {
        const { ten, mota } = req.body;
        if (!ten || ten.trim() === '') {
            return res.status(400).json({ message: "Tên danh mục là bắt buộc." });
        }
        const newCategory = Category.create(ten, mota);
        res.status(201).json(newCategory);
    } catch (error) {
        if (error.code === 'DUPLICATE_CATEGORY_NAME') {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: "Lỗi khi tạo danh mục: " + error.message });
    }
}

async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { ten, mota } = req.body;

        if (!ten || ten.trim() === '') {
            return res.status(400).json({ message: "Tên danh mục là bắt buộc." });
        }
        const updatedCategory = Category.update(Number(id), ten, mota);
        if (!updatedCategory) {
            return res.status(404).json({ message: "Không tìm thấy danh mục để cập nhật." });
        }
        res.json(updatedCategory);
    } catch (error) {
        if (error.code === 'DUPLICATE_CATEGORY_NAME') {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: "Lỗi khi cập nhật danh mục: " + error.message });
    }
}

async function deleteCategory(req, res) {
    try {
        const { id } = req.params;
        const success = Category.deleteById(Number(id));
        if (!success) {
            return res.status(404).json({ message: "Không tìm thấy danh mục để xóa hoặc không thể xóa." });
        }
        res.status(200).json({ message: "Danh mục đã được xóa thành công." });
    } catch (error) {
        if (error.code === 'CATEGORY_IN_USE') {
            return res.status(400).json({ message: error.message }); // Bad Request vì không thể xóa
        }
        res.status(500).json({ message: "Lỗi khi xóa danh mục: " + error.message });
    }
}

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };