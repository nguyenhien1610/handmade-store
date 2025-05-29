import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './OrdersPage.css';
import { fetchOrders } from "../../../api/orderService";

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    orderCode: '',
    status: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  const statusClassMap = {
    'Chờ xử lý': 'status-pending',
    'Đã xác nhận': 'status-confirmed',
    'Đang giao': 'status-shipping',
    'Hoàn thành': 'status-completed',
    'Đã hủy': 'status-cancelled',
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    // Implement search logic here
    console.log('Searching with filters:', filters);
  };

  const handleClearFilters = () => {
    setFilters({
      orderCode: '',
      status: '',
      fromDate: '',
      toDate: ''
    });
  };

  const handleExport = () => {
    // Implement export logic here
    console.log('Exporting orders...');
  };

  const viewOrder = (orderId) => {
    // Navigate to order detail page
    navigate(`/orders/${orderId}`);
  };

  const editOrder = (orderId) => {
    // Navigate to order detail page for editing
    navigate(`/orders/${orderId}`);
  };

  const deleteOrder = (orderId) => {
    // Implement delete logic here
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      console.log('Deleting order:', orderId);
      // Add delete API call here
    }
  };

  return (
    <div className="orders-content">
      {/* Page Header */}
      <div className="orders-header">
        <h1 className="orders-title">Quản lý đơn hàng</h1>
        <p className="orders-description">Theo dõi và quản lý tất cả đơn hàng của cửa hàng</p>
      </div>

      {/* Statistics Cards */}
      <div className="orders-stats">
        <div className="orders-stat-card">
          <div className="stat-icon-wrapper blue">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{orders.length}</div>
            <div className="stat-label">Tổng đơn hàng</div>
          </div>
        </div>
        
        <div className="orders-stat-card">
          <div className="stat-icon-wrapper orange">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {orders.filter(order => order.trangthai === 'Chờ xử lý').length}
            </div>
            <div className="stat-label">Đang chờ xử lý</div>
          </div>
        </div>
        
        <div className="orders-stat-card">
          <div className="stat-icon-wrapper green">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {orders.filter(order => order.trangthai === 'Hoàn thành').length}
            </div>
            <div className="stat-label">Đã hoàn thành</div>
          </div>
        </div>
        
        <div className="orders-stat-card">
          <div className="stat-icon-wrapper pink">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {orders.reduce((total, order) => total + Number(order.tongtien || 0), 0).toLocaleString()}
            </div>
            <div className="stat-label">Doanh thu (VNĐ)</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="orders-filter-section">
        <div className="filter-container">
          <div className="filter-row">
            <div className="filter-item">
              <label className="filter-label">Mã đơn hàng</label>
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Nhập mã đơn hàng"
                value={filters.orderCode}
                onChange={(e) => handleFilterChange('orderCode', e.target.value)}
              />
            </div>
            
            <div className="filter-item">
              <label className="filter-label">Trạng thái</label>
              <select 
                className="filter-input filter-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="Chờ xử lý">Chờ xử lý</option>
                <option value="Đã xác nhận">Đã xác nhận</option>
                <option value="Đang giao">Đang giao</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
            
            <div className="filter-item">
              <label className="filter-label">Từ ngày</label>
              <input 
                type="date" 
                className="filter-input"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
            </div>
            
            <div className="filter-item">
              <label className="filter-label">Đến ngày</label>
              <input 
                type="date" 
                className="filter-input"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-actions">
            <button className="btn btn-search" onClick={handleSearch}>
              <i className="fas fa-search"></i>
              Tìm kiếm
            </button>
            <button className="btn btn-clear" onClick={handleClearFilters}>
              <i className="fas fa-times"></i>
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table Section */}
      <div className="orders-table-section">
        <div className="table-header-wrapper">
          <h3 className="table-section-title">Danh sách đơn hàng</h3>
          <button className="btn btn-export" onClick={handleExport}>
            <i className="fas fa-download"></i>
            Xuất Excel
          </button>
        </div>
        
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Ngày nhận dự kiến</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id_dh}>
                  <td>
                    <span className="order-code">#{order.id_dh}</span>
                  </td>
                  <td>
                    <span className="customer-info">{order.id_user}</span>
                  </td>
                  <td>
                    <span className="order-date">{order.ngaydat}</span>
                  </td>
                  <td>
                    <span className="order-total">{Number(order.tongtien || 0).toLocaleString()}đ</span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClassMap[order.trangthai] || ''}`}>
                      {order.trangthai}
                    </span>
                  </td>
                  <td>
                    <span className="payment-status">{order.trang_thai_thanh_toan}</span>
                  </td>
                  <td>
                    <span className="delivery-date">{order.ngay_nhan_du_kien}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="action-btn view-btn" 
                        onClick={() => viewOrder(order.id_dh)}
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => editOrder(order.id_dh)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => deleteOrder(order.id_dh)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="pagination-wrapper">
          <div className="pagination">
            <button className="pagination-btn" disabled>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn dots">...</button>
            <button className="pagination-btn">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;