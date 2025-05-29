const CartModel = require('../models/cartModel');

class CartController {
    constructor() {
        this.cartModel = new CartModel();
    }

    // Lấy thông tin giỏ hàng
    async getCart(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để xem giỏ hàng'
                });
            }

            const cartData = await this.cartModel.getCartDetails(userId);
            
            // Tính phí vận chuyển
            const shippingFee = this.calculateShippingFee(cartData.subtotal);
            const finalTotal = cartData.subtotal + shippingFee;

            res.json({
                success: true,
                data: {
                    ...cartData,
                    shipping_fee: shippingFee,
                    final_total: finalTotal
                }
            });
        } catch (error) {
            console.error('Error in getCart:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thông tin giỏ hàng',
                error: error.message
            });
        }
    }

    // Thêm sản phẩm vào giỏ hàng
    async addToCart(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;
            const { productId, quantity = 1 } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'
                });
            }

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin sản phẩm'
                });
            }

            if (quantity <= 0 || !Number.isInteger(quantity)) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng phải là số nguyên dương'
                });
            }

            const cartData = await this.cartModel.addToCart(userId, productId, quantity);
            
            // Tính phí vận chuyển
            const shippingFee = this.calculateShippingFee(cartData.subtotal);
            const finalTotal = cartData.subtotal + shippingFee;

            res.json({
                success: true,
                message: 'Đã thêm sản phẩm vào giỏ hàng',
                data: {
                    ...cartData,
                    shipping_fee: shippingFee,
                    final_total: finalTotal
                }
            });
        } catch (error) {
            console.error('Error in addToCart:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Lỗi khi thêm sản phẩm vào giỏ hàng'
            });
        }
    }

    // Cập nhật số lượng sản phẩm
    async updateCartItem(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;
            const { cartItemId } = req.params;
            const { quantity } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập'
                });
            }

            if (!cartItemId || quantity === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết'
                });
            }

            if (quantity < 0 || !Number.isInteger(quantity)) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng phải là số nguyên không âm'
                });
            }

            const cartData = await this.cartModel.updateCartItem(userId, parseInt(cartItemId), quantity);
            
            // Tính phí vận chuyển
            const shippingFee = this.calculateShippingFee(cartData.subtotal);
            const finalTotal = cartData.subtotal + shippingFee;

            res.json({
                success: true,
                message: quantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Đã cập nhật số lượng',
                data: {
                    ...cartData,
                    shipping_fee: shippingFee,
                    final_total: finalTotal
                }
            });
        } catch (error) {
            console.error('Error in updateCartItem:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Lỗi khi cập nhật giỏ hàng'
            });
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    async removeFromCart(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;
            const { cartItemId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập'
                });
            }

            if (!cartItemId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin sản phẩm'
                });
            }

            const cartData = await this.cartModel.removeFromCart(userId, parseInt(cartItemId));
            
            // Tính phí vận chuyển
            const shippingFee = this.calculateShippingFee(cartData.subtotal);
            const finalTotal = cartData.subtotal + shippingFee;

            res.json({
                success: true,
                message: 'Đã xóa sản phẩm khỏi giỏ hàng',
                data: {
                    ...cartData,
                    shipping_fee: shippingFee,
                    final_total: finalTotal
                }
            });
        } catch (error) {
            console.error('Error in removeFromCart:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Lỗi khi xóa sản phẩm'
            });
        }
    }

    // Xóa toàn bộ giỏ hàng
    async clearCart(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập'
                });
            }

            const cartData = await this.cartModel.clearCart(userId);

            res.json({
                success: true,
                message: 'Đã xóa toàn bộ giỏ hàng',
                data: {
                    ...cartData,
                    shipping_fee: 0,
                    final_total: 0
                }
            });
        } catch (error) {
            console.error('Error in clearCart:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa giỏ hàng'
            });
        }
    }

    // Áp dụng mã giảm giá
    async applyCoupon(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;
            const { couponCode } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập'
                });
            }

            if (!couponCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập mã giảm giá'
                });
            }

            // Lấy thông tin giỏ hàng hiện tại
            const cartData = await this.cartModel.getCartDetails(userId);
            
            if (cartData.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giỏ hàng trống'
                });
            }

            // Áp dụng mã giảm giá
            const couponResult = await this.cartModel.applyCoupon(couponCode.trim().toUpperCase(), cartData.subtotal);
            
            // Tính toán lại tổng tiền
            const shippingFee = this.calculateShippingFee(cartData.subtotal);
            const finalTotal = couponResult.final_total + shippingFee;

            res.json({
                success: true,
                message: 'Áp dụng mã giảm giá thành công',
                data: {
                    ...cartData,
                    coupon: couponResult,
                    shipping_fee: shippingFee,
                    subtotal: cartData.subtotal,
                    discount_amount: couponResult.discount_amount,
                    final_total: finalTotal
                }
            });
        } catch (error) {
            console.error('Error in applyCoupon:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Lỗi khi áp dụng mã giảm giá'
            });
        }
    }

    // Lấy số lượng items trong giỏ hàng (cho header)
    async getCartCount(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;

            if (!userId) {
                return res.json({
                    success: true,
                    data: { count: 0 }
                });
            }

            const count = await this.cartModel.getCartCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Error in getCartCount:', error);
            res.json({
                success: true,
                data: { count: 0 }
            });
        }
    }

    // Tính phí vận chuyển
    calculateShippingFee(subtotal) {
        const freeShipThreshold = 500000; // 500k
        const defaultShippingFee = 30000; // 30k
        
        if (subtotal >= freeShipThreshold) {
            return 0;
        }
        return defaultShippingFee;
    }

    // Validate dữ liệu giỏ hàng trước khi checkout
    async validateCartForCheckout(req, res) {
        try {
            const userId = req.user?.id_user || req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập'
                });
            }

            const cartData = await this.cartModel.getCartDetails(userId);
            
            if (cartData.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giỏ hàng trống'
                });
            }

            // Kiểm tra tồn kho
            const invalidItems = [];
            for (const item of cartData.items) {
                if (item.slton < item.soluong) {
                    invalidItems.push({
                        name: item.ten,
                        requested: item.soluong,
                        available: item.slton
                    });
                }
            }

            if (invalidItems.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Một số sản phẩm không đủ tồn kho',
                    data: { invalid_items: invalidItems }
                });
            }

            // Tính phí vận chuyển
            const shippingFee = this.calculateShippingFee(cartData.subtotal);
            const finalTotal = cartData.subtotal + shippingFee;

            res.json({
                success: true,
                message: 'Giỏ hàng hợp lệ',
                data: {
                    ...cartData,
                    shipping_fee: shippingFee,
                    final_total: finalTotal
                }
            });
        } catch (error) {
            console.error('Error in validateCartForCheckout:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi kiểm tra giỏ hàng'
            });
        }
    }

    // Cleanup khi shutdown
    cleanup() {
        if (this.cartModel && typeof this.cartModel.close === 'function') {
            this.cartModel.close();
        }
    }
}

module.exports = new CartController();