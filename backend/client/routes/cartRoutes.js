const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Middleware xác thực (optional - có thể thay thế bằng middleware xác thực của bạn)
const authMiddleware = (req, res, next) => {
    // Kiểm tra session hoặc JWT token
    const userId = req.session?.userId || req.user?.id_user;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Vui lòng đăng nhập để tiếp tục'
        });
    }
    next();
};

// Middleware optional auth (cho những route không bắt buộc đăng nhập)
const optionalAuthMiddleware = (req, res, next) => {
    // Không block request nếu chưa đăng nhập, chỉ check và pass thông tin user
    next();
};

// ===============================
// CART ROUTES
// ===============================

// Lấy thông tin giỏ hàng
router.get('/', optionalAuthMiddleware, cartController.getCart);

// Lấy số lượng items trong giỏ hàng (cho header)
router.get('/count', optionalAuthMiddleware, cartController.getCartCount);

// Validate giỏ hàng trước khi checkout
router.get('/validate', authMiddleware, cartController.validateCartForCheckout);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authMiddleware, cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/item/:cartItemId', authMiddleware, cartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/item/:cartItemId', authMiddleware, cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', authMiddleware, cartController.clearCart);

// Áp dụng mã giảm giá
router.post('/coupon', authMiddleware, cartController.applyCoupon);

module.exports = router;