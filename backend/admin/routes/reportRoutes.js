// backend/admin/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/ReportsController');

// Middleware để validate admin access (optional)
// router.use(ReportsController.validateAdminAccess);

/**
 * @route GET /api/admin/reports
 * @desc Lấy báo cáo tổng quan với filter
 * @params {string} timeRange - Khoảng thời gian (7, 30, 90, 180, 365)
 * @params {string} category - Danh mục (all, handmade, jewelry, home-decor, clothing, accessories)  
 * @params {string} reportType - Loại báo cáo (overview, revenue, products, customers, orders)
 * @access Admin only
 */
router.get('/', ReportsController.getReports);

/**
 * @route GET /api/admin/reports/revenue-chart
 * @desc Lấy dữ liệu biểu đồ doanh thu
 * @params {string} timeRange - Khoảng thời gian
 * @params {string} chartType - Loại biểu đồ (daily, weekly, monthly)
 * @access Admin only
 */
router.get('/revenue-chart', ReportsController.getRevenueChart);

/**
 * @route GET /api/admin/reports/category-performance
 * @desc Lấy hiệu suất theo danh mục
 * @params {string} timeRange - Khoảng thời gian
 * @access Admin only
 */
router.get('/category-performance', ReportsController.getCategoryPerformance);

/**
 * @route GET /api/admin/reports/top-products
 * @desc Lấy danh sách sản phẩm bán chạy
 * @params {string} timeRange - Khoảng thời gian
 * @params {string} limit - Số lượng sản phẩm trả về (default: 10)
 * @access Admin only
 */
router.get('/top-products', ReportsController.getTopProducts);

/**
 * @route GET /api/admin/reports/customer-analytics
 * @desc Lấy phân tích khách hàng
 * @params {string} timeRange - Khoảng thời gian
 * @access Admin only
 */
router.get('/customer-analytics', ReportsController.getCustomerAnalytics);

/**
 * @route GET /api/admin/reports/quick-stats
 * @desc Lấy thống kê nhanh cho dashboard
 * @params {string} timeRange - Khoảng thời gian
 * @access Admin only
 */
router.get('/quick-stats', ReportsController.getQuickStats);

/**
 * @route GET /api/admin/reports/export
 * @desc Xuất báo cáo ra file
 * @params {string} type - Loại báo cáo (overview, products, customers, revenue, categories)
 * @params {string} format - Định dạng file (json, csv)
 * @params {string} timeRange - Khoảng thời gian
 * @access Admin only
 */
router.get('/export', ReportsController.exportReport);

// Error handling middleware for reports routes
router.use((error, req, res, next) => {
  console.error('Reports route error:', error);
  res.status(500).json({
    success: false,
    message: 'Lỗi server khi xử lý báo cáo',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;