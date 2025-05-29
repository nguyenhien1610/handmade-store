// /frontend/src/api/cartService.js
import axios from './axios';

const cartService = {
  // Lấy thông tin giỏ hàng
  getCart: async () => {
    try {
      const response = await axios.get('/api/cart');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy số lượng items trong giỏ hàng (cho header)
  getCartCount: async () => {
    try {
      const response = await axios.get('/api/cart/count');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await axios.post('/api/cart/add', {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  updateCartItem: async (cartItemId, quantity) => {
    try {
      const response = await axios.put(`/api/cart/item/${cartItemId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeFromCart: async (cartItemId) => {
    try {
      const response = await axios.delete(`/api/cart/item/${cartItemId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async () => {
    try {
      const response = await axios.delete('/api/cart/clear');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Áp dụng mã giảm giá
  applyCoupon: async (couponCode) => {
    try {
      const response = await axios.post('/api/cart/coupon', {
        couponCode
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate giỏ hàng trước khi checkout
  validateCart: async () => {
    try {
      const response = await axios.get('/api/cart/validate');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default cartService;