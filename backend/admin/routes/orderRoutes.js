const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Lấy tất cả đơn hàng với phân trang và lọc
router.get('/', orderController.getAllOrders);

// Lấy thống kê đơn hàng tổng quan
router.get('/stats', orderController.getOrderStats);

// Lấy thống kê đơn hàng theo thời gian (cho biểu đồ)
router.get('/stats/timeline', orderController.getOrderStatsByTime);

// Xuất dữ liệu đơn hàng
router.get('/export', orderController.exportOrders);

// Lấy danh sách trạng thái hợp lệ
router.get('/statuses', orderController.getValidStatuses);

// Lấy đơn hàng theo user ID
router.get('/user/:userId', orderController.getOrdersByUserId);

// Kiểm tra đơn hàng có tồn tại không
router.get('/:id/exists', orderController.checkOrderExists);

// Lấy chi tiết một đơn hàng
router.get('/:id', orderController.getOrderById);

// Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// Cập nhật thông tin đơn hàng
router.put('/:id', orderController.updateOrder);

// Cập nhật trạng thái đơn hàng
router.put('/:id/status', orderController.updateOrderStatus);

// Cập nhật ghi chú đơn hàng
router.put('/:id/notes', orderController.updateOrderNotes);

// Xóa đơn hàng (soft delete hoặc hard delete)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;