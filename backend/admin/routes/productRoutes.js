const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/products/');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file ảnh (JPG, PNG, GIF)!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB per file
    fileFilter: fileFilter
});

// POST: Tạo sản phẩm mới
// Middleware 'upload.array('product_images', 8)' sẽ xử lý tối đa 8 file từ field có tên 'product_images'
router.post('/', upload.array('product_images', 8), productController.createProduct);

// GET: Lấy tất cả sản phẩm (có thể có filter, sort, pagination)
router.get('/', productController.getAllProducts);

// GET: Lấy một sản phẩm theo ID
router.get('/:id', productController.getProductById);

// PUT: Cập nhật sản phẩm theo ID
// Cũng sử dụng upload.array vì người dùng có thể muốn thay đổi/thêm ảnh khi cập nhật
router.put('/:id', upload.array('product_images', 8), productController.updateProduct);

// DELETE: Xóa sản phẩm theo ID
router.delete('/:id', productController.deleteProduct);


module.exports = router;