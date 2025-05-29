import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./OrderDetail.css";

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [sidebarActive, setSidebarActive] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/admin/orders/${orderId}`);
        setOrderData(res.data);
        setNotes(res.data.notes || '');
      } catch (err) {
        setError(err.message || "Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrderDetail();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      setOrderData(res.data);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/notes`, {
        notes,
      });
      alert("Ghi chú đã được lưu");
    } catch (err) {
      console.error("Lỗi khi lưu ghi chú:", err);
    }
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status, paymentStatus = null) => {
    const statusMap = {
      pending: { class: "status-pending", icon: "fas fa-clock", text: "Chờ xử lý" },
      confirmed: { class: "status-confirmed", icon: "fas fa-check", text: "Đã xác nhận" },
      shipping: { class: "status-shipping", icon: "fas fa-truck", text: "Đang giao hàng" },
      completed: { class: "status-completed", icon: "fas fa-check-circle", text: "Hoàn thành" },
      cancelled: { class: "status-cancelled", icon: "fas fa-times", text: "Đã hủy" },
      paid: { class: "status-completed", icon: "fas fa-credit-card", text: "Đã thanh toán" },
      unpaid: { class: "status-pending", icon: "fas fa-credit-card", text: "Chưa thanh toán" },
    };

    const info = statusMap[paymentStatus || status] || statusMap.pending;
    return (
      <span className={`status-badge ${info.class}`}>
        <i className={info.icon}></i> {info.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Lỗi: {error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="error-container">
        <p>Không tìm thấy thông tin đơn hàng</p>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      {/* Header */}
      <header>
        <div className="nav-container">
          <div className="logo">Handmade<span>Store</span></div>
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarActive(!sidebarActive)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="nav-right">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <span>Admin</span>
            </div>
            <button className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
          <ul className="sidebar-menu">
            <li><a href="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</a></li>
            <li><a href="/orders" className="active"><i className="fas fa-shopping-bag"></i> Quản lý đơn hàng</a></li>
            <li><a href="/products"><i className="fas fa-box"></i> Quản lý sản phẩm</a></li>
            <li><a href="/customers"><i className="fas fa-users"></i> Quản lý khách hàng</a></li>
            <li><a href="/reports"><i className="fas fa-chart-bar"></i> Báo cáo</a></li>
            <li><a href="/settings"><i className="fas fa-cog"></i> Cài đặt</a></li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <div className="breadcrumb-links">
              <a href="/dashboard"><i className="fas fa-home"></i> Dashboard</a>
              <span>/</span>
              <a href="/orders">Quản lý đơn hàng</a>
              <span>/</span>
              <span>Chi tiết đơn hàng #{orderData.orderCode}</span>
            </div>
          </div>

          {/* Order Header */}
          <div className="order-header">
            <div className="order-title-section">
              <h1 className="order-title">Chi tiết đơn hàng #{orderData.orderCode}</h1>
              <div className="order-actions">
                <button className="action-button btn-secondary" onClick={handlePrintOrder}>
                  <i className="fas fa-print"></i> In đơn hàng
                </button>
                <button 
                  className="action-button btn-success"
                  onClick={() => handleStatusUpdate('confirmed')}
                >
                  <i className="fas fa-edit"></i> Cập nhật trạng thái
                </button>
                <button className="action-button btn-primary" onClick={() => window.history.back()}>
                  <i className="fas fa-arrow-left"></i> Quay lại
                </button>
              </div>
            </div>
            
            <div className="order-info-grid">
              <div className="info-item">
                <div className="info-label">Mã đơn hàng</div>
                <div className="info-value">#{orderData.orderCode}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Ngày đặt hàng</div>
                <div className="info-value">{formatDate(orderData.createdAt)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Trạng thái đơn hàng</div>
                <div className="info-value">
                  {getStatusBadge(orderData.status)}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Phương thức thanh toán</div>
                <div className="info-value">{orderData.paymentMethod}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Trạng thái thanh toán</div>
                <div className="info-value">
                  {getStatusBadge(null, orderData.paymentStatus)}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Tổng giá trị</div>
                <div className="info-value" style={{color: 'var(--dark-pink)', fontSize: '18px'}}>
                  {formatCurrency(orderData.totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Product Section */}
              <div className="section">
                <div className="section-header">
                  <h3 className="section-title">
                    <i className="fas fa-box"></i> Sản phẩm trong đơn hàng
                  </h3>
                </div>
                <div className="section-content">
                  <ul className="product-list">
                    {orderData.items?.map((item, index) => (
                      <li key={index} className="product-item">
                        <div className="product-image">
                          {item.product.image ? (
                            <img src={item.product.image} alt={item.product.name} />
                          ) : (
                            <i className="fas fa-gift"></i>
                          )}
                        </div>
                        <div className="product-details">
                          <div className="product-name">{item.product.name}</div>
                          <div className="product-description">{item.product.description}</div>
                          <div className="product-meta">
                            {item.product.color && (
                              <div className="meta-item">
                                <i className="fas fa-palette"></i>
                                <span>Màu: {item.product.color}</span>
                              </div>
                            )}
                            {item.product.size && (
                              <div className="meta-item">
                                <i className="fas fa-ruler"></i>
                                <span>Kích thước: {item.product.size}</span>
                              </div>
                            )}
                            <div className="meta-item">
                              <i className="fas fa-shopping-cart"></i>
                              <span>Số lượng: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="product-price">
                          <div className="price-per-item">
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                          <div className="total-price">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="order-summary">
                    <div className="summary-row">
                      <span className="summary-label">Tạm tính:</span>
                      <span className="summary-value">{formatCurrency(orderData.subtotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Phí vận chuyển:</span>
                      <span className="summary-value">
                        {orderData.shippingFee === 0 ? 'Miễn phí' : formatCurrency(orderData.shippingFee)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Giảm giá:</span>
                      <span className="summary-value">{formatCurrency(orderData.discount || 0)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Tổng cộng:</span>
                      <span className="summary-value">{formatCurrency(orderData.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="section">
                <div className="section-header">
                  <h3 className="section-title">
                    <i className="fas fa-history"></i> Lịch sử đơn hàng
                  </h3>
                </div>
                <div className="section-content">
                  <div className="timeline">
                    {orderData.timeline?.map((item, index) => (
                      <div key={index} className="timeline-item">
                        <div className={`timeline-dot ${item.status}`}></div>
                        <div className="timeline-content">
                          <div className="timeline-title">{item.title}</div>
                          <div className="timeline-description">{item.description}</div>
                          <div className="timeline-time">{formatDate(item.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="section notes-section">
                <div className="section-header">
                  <h3 className="section-title">
                    <i className="fas fa-sticky-note"></i> Ghi chú
                  </h3>
                </div>
                <div className="section-content">
                  <textarea
                    className="note-input"
                    placeholder="Thêm ghi chú cho đơn hàng..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="note-actions">
                    <button className="action-button btn-primary" onClick={handleSaveNotes}>
                      <i className="fas fa-save"></i> Lưu ghi chú
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Customer Information */}
              <div className="section">
                <div className="section-header">
                  <h3 className="section-title">
                    <i className="fas fa-user"></i> Thông tin khách hàng
                  </h3>
                </div>
                <div className="section-content">
                  <div className="customer-info">
                    <div className="info-group">
                      <div className="group-title">
                        <i className="fas fa-user-circle"></i> Thông tin cá nhân
                      </div>
                      <div className="group-content">
                        <strong>{orderData.customer.name}</strong><br/>
                        Email: {orderData.customer.email}<br/>
                        Điện thoại: {orderData.customer.phone}<br/>
                        {orderData.customer.isVip && <span>Khách hàng thân thiết</span>}
                      </div>
                    </div>
                    
                    <div className="info-group">
                      <div className="group-title">
                        <i className="fas fa-map-marker-alt"></i> Địa chỉ giao hàng
                      </div>
                      <div className="group-content">
                        {orderData.shippingAddress.street}<br/>
                        {orderData.shippingAddress.ward}, {orderData.shippingAddress.district}<br/>
                        {orderData.shippingAddress.city}, {orderData.shippingAddress.country}
                      </div>
                    </div>
                    
                    <div className="info-group">
                      <div className="group-title">
                        <i className="fas fa-receipt"></i> Địa chỉ hóa đơn
                      </div>
                      <div className="group-content">
                        {orderData.billingAddress ? (
                          <>
                            {orderData.billingAddress.street}<br/>
                            {orderData.billingAddress.ward}, {orderData.billingAddress.district}<br/>
                            {orderData.billingAddress.city}, {orderData.billingAddress.country}
                          </>
                        ) : (
                          <em style={{color: '#666'}}>Giống địa chỉ giao hàng</em>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="section">
                <div className="section-header">
                  <h3 className="section-title">
                    <i className="fas fa-credit-card"></i> Thông tin thanh toán
                  </h3>
                </div>
                <div className="section-content">
                  <div className="customer-info">
                    <div className="info-group">
                      <div className="group-title">
                        <i className="fas fa-university"></i> Phương thức thanh toán
                      </div>
                      <div className="group-content">
                        {orderData.paymentMethod}<br/>
                        {orderData.paymentDetails && (
                          <>
                            {orderData.paymentDetails.bankName && (
                              <>Ngân hàng: {orderData.paymentDetails.bankName}<br /></>
                            )}
                            {orderData.paymentDetails.accountNumber && (
                              <>STK: {orderData.paymentDetails.accountNumber}<br /></>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {orderData.paymentHistory && orderData.paymentHistory.length > 0 && (
                      <div className="info-group">
                        <div className="group-title">
                          <i className="fas fa-history"></i> Lịch sử thanh toán
                        </div>
                        <div className="group-content">
                          {orderData.paymentHistory.map((payment, index) => (
                            <div key={index} style={{marginBottom: '10px'}}>
                              <strong>{formatCurrency(payment.amount)}</strong><br/>
                              {formatDate(payment.date)}<br/>
                              <small>{payment.note}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDetail;