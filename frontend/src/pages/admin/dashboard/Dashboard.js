// src/pages/admin/dashboard/Dashboard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RecentOrders from './components/RecentOrders';
import SalesChart from './components/SalesChart';
import OrderStatusChart from './components/OrderStatusChart';
import TopProducts from './components/TopProducts';
import StatCard from './components/StatCard';
import './Dashboard.css';

const Dashboard = () => {
  const [activeChartFilter, setActiveChartFilter] = useState('Tuần');

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Xem tổng quan về hoạt động kinh doanh của cửa hàng</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <StatCard 
          icon="shopping-bag" 
          iconClass="orders" 
          number="248" 
          label="Tổng đơn hàng" 
        />
        <StatCard 
          icon="dollar-sign" 
          iconClass="revenue" 
          number="125.6M" 
          label="Doanh thu (VNĐ)" 
        />
        <StatCard 
          icon="users" 
          iconClass="customers" 
          number="178" 
          label="Khách hàng" 
        />
        <StatCard 
          icon="box" 
          iconClass="products" 
          number="65" 
          label="Sản phẩm" 
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Doanh thu theo thời gian</h3>
            <div className="chart-filter">
              <button 
                className={`chart-filter-btn ${activeChartFilter === 'Ngày' ? 'active' : ''}`}
                onClick={() => setActiveChartFilter('Ngày')}
              >
                Ngày
              </button>
              <button 
                className={`chart-filter-btn ${activeChartFilter === 'Tuần' ? 'active' : ''}`}
                onClick={() => setActiveChartFilter('Tuần')}
              >
                Tuần
              </button>
              <button 
                className={`chart-filter-btn ${activeChartFilter === 'Tháng' ? 'active' : ''}`}
                onClick={() => setActiveChartFilter('Tháng')}
              >
                Tháng
              </button>
              <button 
                className={`chart-filter-btn ${activeChartFilter === 'Năm' ? 'active' : ''}`}
                onClick={() => setActiveChartFilter('Năm')}
              >
                Năm
              </button>
            </div>
          </div>
          <div className="chart-container">
            <SalesChart filter={activeChartFilter} />
          </div>
        </div>
        
        {/* Order Status Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Trạng thái đơn hàng</h3>
          </div>
          <div className="chart-container">
            <OrderStatusChart />
          </div>
        </div>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="two-column-grid">
        {/* Recent Orders */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="view-all">
              Xem tất cả <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <RecentOrders />
        </div>
        
        {/* Top Products */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Sản phẩm bán chạy</h3>
            <Link to="/admin/products" className="view-all">
              Xem tất cả <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <TopProducts />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;