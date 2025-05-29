const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../../middlewares/auth'); // Middleware xác thực

// Middleware xác thực cho tất cả routes
router.use(authenticateToken);

// POST /orders/from-cart - Tạo đơn hàng từ giỏ hàng
router.post('/from-cart', OrderController.createFromCart);

// POST /orders/from-product - Tạo đơn hàng từ sản phẩm đơn lẻ
router.post('/from-product', OrderController.createFromProduct);

// GET /orders - Lấy danh sách đơn hàng của user (có phân trang)
router.get('/', OrderController.getMyOrders);

// GET /orders/:id - Lấy chi tiết đơn hàng
router.get('/:id', OrderController.getOrderDetail);

// PUT /orders/:id - Cập nhật thông tin đơn hàng
router.put('/:id', OrderController.updateOrder);

// DELETE /orders/:id - Hủy đơn hàng
router.delete('/:id', OrderController.cancelOrder);

// POST /orders/validate-coupon - Kiểm tra mã giảm giá
router.post('/validate-coupon', OrderController.validateCoupon);

module.exports = router;