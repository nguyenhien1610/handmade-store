const db = require('../../config/database');

class CartModel {
    // Lấy hoặc tạo giỏ hàng cho user
    getOrCreateCart(userId) {
        try {
            // Kiểm tra giỏ hàng hiện tại
            let cart = this.db.prepare(`
                SELECT * FROM gio_hang WHERE id_user = ? AND noi_bat = 1
            `).get(userId);

            if (!cart) {
                // Tạo giỏ hàng mới
                const stmt = this.db.prepare(`
                    INSERT INTO gio_hang (id_user, ngaytao, noi_bat, ngaycapnhat)
                    VALUES (?, datetime('now'), 1, datetime('now'))
                `);
                const result = stmt.run(userId);
                
                cart = this.db.prepare(`
                    SELECT * FROM gio_hang WHERE id_gh = ?
                `).get(result.lastInsertRowid);
            }

            return cart;
        } catch (error) {
            console.error('Error in getOrCreateCart:', error);
            throw error;
        }
    }

    // Lấy chi tiết giỏ hàng với thông tin sản phẩm
    getCartDetails(userId) {
        try {
            const cart = this.getOrCreateCart(userId);
            
            const cartItems = this.db.prepare(`
                SELECT 
                    ctgh.id_ctgh,
                    ctgh.soluong,
                    sp.id_sp,
                    sp.ten,
                    sp.gia,
                    sp.gia_khuyen_mai,
                    sp.ha_url,
                    sp.slton,
                    lsp.ten as ten_loai,
                    n.ten_nhan,
                    n.mau_sac_hex
                FROM chi_tiet_gio_hang ctgh
                JOIN san_pham sp ON ctgh.id_sp = sp.id_sp
                LEFT JOIN loai_san_pham lsp ON sp.id_loai = lsp.id_loai
                LEFT JOIN nhan n ON sp.id_nhan = n.id_nhan
                WHERE ctgh.id_gh = ?
                ORDER BY ctgh.id_ctgh DESC
            `).all(cart.id_gh);

            // Tính toán tổng tiền
            let subtotal = 0;
            const processedItems = cartItems.map(item => {
                const price = item.gia_khuyen_mai || item.gia;
                const total = price * item.soluong;
                subtotal += total;
                
                return {
                    ...item,
                    gia_hien_tai: price,
                    tong_tien: total
                };
            });

            return {
                cart_info: cart,
                items: processedItems,
                subtotal: subtotal,
                item_count: cartItems.length,
                total_quantity: cartItems.reduce((sum, item) => sum + item.soluong, 0)
            };
        } catch (error) {
            console.error('Error in getCartDetails:', error);
            throw error;
        }
    }

    // Thêm sản phẩm vào giỏ hàng
    addToCart(userId, productId, quantity = 1) {
        try {
            const cart = this.getOrCreateCart(userId);
            
            // Kiểm tra sản phẩm có tồn tại không
            const product = this.db.prepare(`
                SELECT id_sp, slton FROM san_pham WHERE id_sp = ?
            `).get(productId);

            if (!product) {
                throw new Error('Sản phẩm không tồn tại');
            }

            if (product.slton < quantity) {
                throw new Error('Số lượng sản phẩm không đủ');
            }

            // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
            const existingItem = this.db.prepare(`
                SELECT * FROM chi_tiet_gio_hang 
                WHERE id_gh = ? AND id_sp = ?
            `).get(cart.id_gh, productId);

            if (existingItem) {
                // Cập nhật số lượng
                const newQuantity = existingItem.soluong + quantity;
                
                if (product.slton < newQuantity) {
                    throw new Error('Số lượng sản phẩm không đủ');
                }

                this.db.prepare(`
                    UPDATE chi_tiet_gio_hang 
                    SET soluong = ? 
                    WHERE id_ctgh = ?
                `).run(newQuantity, existingItem.id_ctgh);
            } else {
                // Thêm mới
                this.db.prepare(`
                    INSERT INTO chi_tiet_gio_hang (id_gh, id_sp, soluong)
                    VALUES (?, ?, ?)
                `).run(cart.id_gh, productId, quantity);
            }

            // Cập nhật thời gian giỏ hàng
            this.db.prepare(`
                UPDATE gio_hang SET ngaycapnhat = datetime('now') WHERE id_gh = ?
            `).run(cart.id_gh);

            return this.getCartDetails(userId);
        } catch (error) {
            console.error('Error in addToCart:', error);
            throw error;
        }
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartItem(userId, cartItemId, quantity) {
        try {
            if (quantity <= 0) {
                return this.removeFromCart(userId, cartItemId);
            }

            const cart = this.getOrCreateCart(userId);
            
            // Kiểm tra item có thuộc về user không
            const cartItem = this.db.prepare(`
                SELECT ctgh.*, sp.slton 
                FROM chi_tiet_gio_hang ctgh
                JOIN san_pham sp ON ctgh.id_sp = sp.id_sp
                WHERE ctgh.id_ctgh = ? AND ctgh.id_gh = ?
            `).get(cartItemId, cart.id_gh);

            if (!cartItem) {
                throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
            }

            if (cartItem.slton < quantity) {
                throw new Error('Số lượng sản phẩm không đủ');
            }

            this.db.prepare(`
                UPDATE chi_tiet_gio_hang 
                SET soluong = ? 
                WHERE id_ctgh = ?
            `).run(quantity, cartItemId);

            // Cập nhật thời gian giỏ hàng
            this.db.prepare(`
                UPDATE gio_hang SET ngaycapnhat = datetime('now') WHERE id_gh = ?
            `).run(cart.id_gh);

            return this.getCartDetails(userId);
        } catch (error) {
            console.error('Error in updateCartItem:', error);
            throw error;
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart(userId, cartItemId) {
        try {
            const cart = this.getOrCreateCart(userId);
            
            // Kiểm tra item có thuộc về user không
            const cartItem = this.db.prepare(`
                SELECT * FROM chi_tiet_gio_hang 
                WHERE id_ctgh = ? AND id_gh = ?
            `).get(cartItemId, cart.id_gh);

            if (!cartItem) {
                throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
            }

            this.db.prepare(`
                DELETE FROM chi_tiet_gio_hang WHERE id_ctgh = ?
            `).run(cartItemId);

            // Cập nhật thời gian giỏ hàng
            this.db.prepare(`
                UPDATE gio_hang SET ngaycapnhat = datetime('now') WHERE id_gh = ?
            `).run(cart.id_gh);

            return this.getCartDetails(userId);
        } catch (error) {
            console.error('Error in removeFromCart:', error);
            throw error;
        }
    }

    // Xóa toàn bộ giỏ hàng
    clearCart(userId) {
        try {
            const cart = this.getOrCreateCart(userId);
            
            this.db.prepare(`
                DELETE FROM chi_tiet_gio_hang WHERE id_gh = ?
            `).run(cart.id_gh);

            // Cập nhật thời gian giỏ hàng
            this.db.prepare(`
                UPDATE gio_hang SET ngaycapnhat = datetime('now') WHERE id_gh = ?
            `).run(cart.id_gh);

            return this.getCartDetails(userId);
        } catch (error) {
            console.error('Error in clearCart:', error);
            throw error;
        }
    }

    // Áp dụng mã giảm giá
    applyCoupon(couponCode, cartTotal) {
        try {
            const coupon = this.db.prepare(`
                SELECT * FROM ma_giam_gia 
                WHERE ma_code = ? 
                AND trang_thai = 'hoat_dong' 
                AND date('now') BETWEEN date(ngay_bat_dau) AND date(ngay_ket_thuc)
                AND (so_lan_su_dung_toi_da IS NULL OR so_lan_da_su_dung < so_lan_su_dung_toi_da)
            `).get(couponCode);

            if (!coupon) {
                throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
            }

            if (cartTotal < coupon.gia_tri_don_hang_toi_thieu) {
                throw new Error(`Đơn hàng tối thiểu phải ${coupon.gia_tri_don_hang_toi_thieu.toLocaleString()}đ`);
            }

            let discountAmount = 0;
            if (coupon.loai_giam === 'phan_tram') {
                discountAmount = Math.floor(cartTotal * coupon.gia_tri_giam / 100);
            } else {
                discountAmount = coupon.gia_tri_giam;
            }

            // Không cho phép giảm giá vượt quá tổng đơn hàng
            discountAmount = Math.min(discountAmount, cartTotal);

            return {
                coupon_id: coupon.id_ma,
                coupon_code: coupon.ma_code,
                coupon_name: coupon.ten_ma,
                discount_type: coupon.loai_giam,
                discount_value: coupon.gia_tri_giam,
                discount_amount: discountAmount,
                final_total: cartTotal - discountAmount
            };
        } catch (error) {
            console.error('Error in applyCoupon:', error);
            throw error;
        }
    }

    // Lấy số lượng items trong giỏ hàng (cho header)
    getCartCount(userId) {
        try {
            const cart = this.getOrCreateCart(userId);
            
            const result = this.db.prepare(`
                SELECT COALESCE(SUM(soluong), 0) as total_quantity
                FROM chi_tiet_gio_hang 
                WHERE id_gh = ?
            `).get(cart.id_gh);

            return result.total_quantity || 0;
        } catch (error) {
            console.error('Error in getCartCount:', error);
            return 0;
        }
    }

    // Đóng kết nối database
    close() {
        this.db.close();
    }
}

module.exports = CartModel;