// src/pages/Cart.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import cartService from "../../../api/cartService";
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState({
    items: [],
    subtotal: 0,
    shipping_fee: 30000,
    discount_amount: 0,
    final_total: 0
  });
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Related products data
  const relatedProducts = [
    { id: 1, name: 'Hoa giấy trang trí', price: 180000, emoji: '💐' },
    { id: 2, name: 'Hộp quà tặng cá nhân hóa', price: 250000, emoji: '🎁' },
    { id: 3, name: 'Móc khóa len', price: 85000, emoji: '🧶' },
    { id: 4, name: 'Tất len handmade', price: 120000, emoji: '🧦' }
  ];

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        setCartData(response.data);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để xem giỏ hàng');
        navigate('/login');
      } else {
        toast.error('Lỗi khi tải giỏ hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    try {
      const response = await cartService.updateCartItem(cartItemId, newQuantity);
      if (response.success) {
        setCartData(response.data);
        toast.success(response.message);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật số lượng');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const response = await cartService.removeFromCart(cartItemId);
      if (response.success) {
        setCartData(response.data);
        toast.success(response.message);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const response = await cartService.applyCoupon(couponCode.trim());
      if (response.success) {
        setCartData(response.data);
        setAppliedCoupon(response.data.coupon);
        toast.success(response.message);
        setCouponCode('');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const addToCart = async (productId) => {
    try {
      const response = await cartService.addToCart(productId, 1);
      if (response.success) {
        toast.success('Đã thêm sản phẩm vào giỏ hàng');
        loadCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để thêm sản phẩm');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Lỗi khi thêm sản phẩm');
      }
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await cartService.validateCart();
      if (response.success) {
        navigate('/checkout', { state: { cartData: response.data } });
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      if (error.response?.data?.data?.invalid_items) {
        const invalidItems = error.response.data.data.invalid_items;
        const message = `Một số sản phẩm không đủ tồn kho:\n${invalidItems.map(item => 
          `${item.name}: có ${item.available}, yêu cầu ${item.requested}`
        ).join('\n')}`;
        toast.error(message);
      } else {
        toast.error(error.response?.data?.message || 'Lỗi khi kiểm tra giỏ hàng');
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getProductEmoji = (category) => {
    const emojiMap = {
      'Đồ chơi handmade': '🧸',
      'Trang trí nhà cửa': '🕯️',
      'Quà tặng': '📔',
      'Phụ kiện thời trang': '👜'
    };
    return emojiMap[category] || '🎁';
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="main-content">
        <h1 className="page-title">Giỏ hàng của bạn</h1>
        
        {cartData.items.length === 0 ? (
          <div className="cart-empty">
            <p>Giỏ hàng của bạn hiện đang trống.</p>
            <button 
              className="continue-shopping"
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-container">
              <div className="cart-header-grid">
                <div>Hình ảnh</div>
                <div>Sản phẩm</div>
                <div>Giá</div>
                <div>Số lượng</div>
                <div>Tổng</div>
                <div></div>
              </div>
              
              <div className="cart-items">
                {cartData.items.map((item) => (
                  <div key={item.id_cart} className="cart-item">
                    <div className="cart-item-img">
                      {getProductEmoji(item.danh_muc)}
                    </div>
                    <div className="cart-item-details">
                      <div className="item-name">{item.ten}</div>
                      <div className="item-category">{item.danh_muc}</div>
                    </div>
                    <div className="item-price">{formatPrice(item.gia)}</div>
                    <div className="quantity-selector">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id_cart, item.soluong - 1)}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.soluong}
                        className="quantity-input"
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          updateQuantity(item.id_cart, newQuantity);
                        }}
                      />
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id_cart, item.soluong + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">{formatPrice(item.thanhtien)}</div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeItem(item.id_cart)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Cart Summary */}
            <div className="cart-summary">
              <h2 className="summary-title">Tổng đơn hàng</h2>
              
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(cartData.subtotal)}</span>
              </div>
              
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{formatPrice(cartData.shipping_fee)}</span>
              </div>
              
              {cartData.discount_amount > 0 && (
                <div className="summary-row">
                  <span>Giảm giá:</span>
                  <span>-{formatPrice(cartData.discount_amount)}</span>
                </div>
              )}
              
              <div className="summary-row total-row">
                <span>Tổng thanh toán:</span>
                <span>{formatPrice(cartData.final_total)}</span>
              </div>
              
              <button className="checkout-btn" onClick={handleCheckout}>
                Tiến hành thanh toán
              </button>
              
              <div className="apply-coupon">
                <input 
                  type="text" 
                  placeholder="Mã giảm giá" 
                  className="coupon-input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={isApplyingCoupon}
                />
                <button 
                  className="apply-btn"
                  onClick={applyCoupon}
                  disabled={isApplyingCoupon}
                >
                  {isApplyingCoupon ? 'Đang áp dụng...' : 'Áp dụng'}
                </button>
              </div>
              
              {appliedCoupon && (
                <div className="applied-coupon">
                  <p>✅ Mã giảm giá: {appliedCoupon.code}</p>
                  <p>Giảm: {formatPrice(appliedCoupon.discount_amount)}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Related Products */}
        <div className="related-products">
          <h2 className="section-title">Có thể bạn cũng thích</h2>
          <div className="product-grid">
            {relatedProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-img">{product.emoji}</div>
                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">{formatPrice(product.price)}</div>
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product.id)}
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;