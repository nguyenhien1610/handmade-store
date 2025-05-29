// src/pages/admin/reports/Reports.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import './Report.css';

const Reports = () => {
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      newCustomers: 0,
      conversionRate: 0,
      netProfit: 0,
      avgOrderValue: 0
    },
    revenueChart: [],
    categoryPerformance: [],
    topProducts: [],
    customerAnalytics: []
  });

  const [filters, setFilters] = useState({
    timeRange: '30',
    category: 'all',
    reportType: 'overview'
  });

  const [activeChartFilter, setActiveChartFilter] = useState('Tuần');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?${new URLSearchParams(filters)}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const applyFilters = () => {
    fetchReportData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const exportData = (type) => {
    console.log(`Exporting ${type} data...`);
  };

  const SummaryCard = ({ icon, iconClass, number, label, trend, detail }) => (
    <div className="summary-card">
      <div className="summary-header">
        <div className={`summary-icon ${iconClass}`}>
          <i className={`fas fa-${icon}`}></i>
        </div>
        <div className={`summary-trend ${trend > 0 ? 'trend-up' : 'trend-down'}`}>
          <i className={`fas fa-arrow-${trend > 0 ? 'up' : 'down'}`}></i> {Math.abs(trend)}%
        </div>
      </div>
      <div className="summary-number">{number}</div>
      <div className="summary-label">{label}</div>
      <div className="summary-detail">{detail}</div>
    </div>
  );

  const CategoryBar = ({ name, value, percentage, colorClass }) => (
    <div className="category-item">
      <div className="category-name">{name}</div>
      <div className="category-bar-container">
        <div className={`category-bar ${colorClass}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="category-value">{formatCurrency(value)}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports" style={{ padding: '30px', maxWidth: '1200px', margin: 'auto' }}>
      <div className="page-header">
        <h1 className="page-title">Báo Cáo & Thống Kê</h1>
        <p className="page-description">Phân tích chi tiết về hiệu suất kinh doanh và xu hướng thị trường</p>

        <div className="report-filters">
          <div className="filter-group">
            <label className="filter-label">Khoảng thời gian</label>
            <select className="filter-select" value={filters.timeRange} onChange={(e) => handleFilterChange('timeRange', e.target.value)}>
              <option value="7">7 ngày qua</option>
              <option value="30">30 ngày qua</option>
              <option value="90">3 tháng qua</option>
              <option value="180">6 tháng qua</option>
              <option value="365">1 năm qua</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Danh mục</label>
            <select className="filter-select" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
              <option value="all">Tất cả danh mục</option>
              <option value="handmade">Đồ handmade</option>
              <option value="jewelry">Trang sức</option>
              <option value="home-decor">Trang trí nhà</option>
              <option value="clothing">Thời trang</option>
              <option value="accessories">Phụ kiện</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Loại báo cáo</label>
            <select className="filter-select" value={filters.reportType} onChange={(e) => handleFilterChange('reportType', e.target.value)}>
              <option value="overview">Tổng quan</option>
              <option value="revenue">Doanh thu</option>
              <option value="products">Sản phẩm</option>
              <option value="customers">Khách hàng</option>
              <option value="orders">Đặt hàng</option>
            </select>
          </div>
          <button className="apply-filter-btn" onClick={applyFilters}>
            <i className="fas fa-search"></i> Áp dụng bộ lọc
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <SummaryCard icon="dollar-sign" iconClass="revenue" number={formatCurrency(reportData.summary.totalRevenue)} label="Tổng doanh thu" trend={12.5} detail={`So với kỳ trước: +${formatCurrency(reportData.summary.totalRevenue * 0.12)}`} />
        <SummaryCard icon="shopping-cart" iconClass="orders" number={formatNumber(reportData.summary.totalOrders)} label="Tổng đơn hàng" trend={8.3} detail={`Trung bình: ${Math.round(reportData.summary.totalOrders / 30)} đơn/ngày`} />
        <SummaryCard icon="users" iconClass="customers" number={formatNumber(reportData.summary.newCustomers)} label="Khách hàng mới" trend={15.7} detail="Tỷ lệ giữ chân: 73.5%" />
        <SummaryCard icon="percentage" iconClass="conversion" number={`${reportData.summary.conversionRate}%`} label="Tỷ lệ chuyển đổi" trend={-2.1} detail="Mục tiêu: 4.5%" />
        <SummaryCard icon="chart-line" iconClass="profit" number={formatCurrency(reportData.summary.netProfit)} label="Lợi nhuận ròng" trend={18.2} detail={`Biên lợi nhuận: ${((reportData.summary.netProfit / reportData.summary.totalRevenue) * 100).toFixed(1)}%`} />
        <SummaryCard icon="trending-up" iconClass="growth" number={formatCurrency(reportData.summary.avgOrderValue)} label="Giá trị đơn hàng TB" trend={23.4} detail={`Cao nhất: ${formatCurrency(reportData.summary.avgOrderValue * 3)}`} />
      </div>

      <div className="charts-section">
        <h2 className="section-title"><i className="fas fa-chart-area"></i> Biểu Đồ Phân Tích</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Xu hướng doanh thu</h3>
              <div className="chart-filter">
                {['Ngày', 'Tuần', 'Tháng'].map(label => (
                  <button key={label} className={`chart-filter-btn ${activeChartFilter === label ? 'active' : ''}`} onClick={() => setActiveChartFilter(label)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="chart-container">
              <div className="line-chart">
                <div className="chart-line"></div>
                <div className="chart-points">
                  {reportData.revenueChart.map((point, index) => (
                    <div key={index} className="chart-point" data-value={formatCurrency(point.value)} title={`${point.label}: ${formatCurrency(point.value)}`}></div>
                  ))}
                </div>
                <div className="chart-labels">
                  {reportData.revenueChart.map((point, index) => (
                    <span key={index}>{point.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Hiệu suất theo danh mục</h3>
            </div>
            <div className="chart-container">
              <div className="category-chart">
                {reportData.categoryPerformance.map((category, index) => (
                  <CategoryBar key={index} name={category.name} value={category.revenue} percentage={category.percentage} colorClass={category.colorClass} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="data-tables-section">
        <h2 className="section-title"><i className="fas fa-table"></i> Bảng Dữ Liệu Chi Tiết</h2>
        <div className="tables-grid">
          <div className="table-card">
            <div className="table-header">
              <h3 className="table-title">Sản phẩm bán chạy</h3>
              <button className="export-btn" onClick={() => exportData('products')}><i className="fas fa-download"></i> Xuất</button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Sản phẩm</th><th>Doanh thu</th><th>Số lượng</th><th>Tỷ lệ</th></tr>
              </thead>
              <tbody>
                {reportData.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{formatCurrency(product.revenue)}</td>
                    <td>{formatNumber(product.quantity)}</td>
                    <td><div className="progress-bar"><div className="progress-fill" style={{ width: `${product.percentage}%` }}></div></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3 className="table-title">Phân tích khách hàng</h3>
              <button className="export-btn" onClick={() => exportData('customers')}><i className="fas fa-download"></i> Xuất</button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Phân khúc</th><th>Số lượng</th><th>Doanh thu</th><th>Tỷ lệ</th></tr>
              </thead>
              <tbody>
                {reportData.customerAnalytics.map((segment, index) => (
                  <tr key={index}>
                    <td>{segment.segment}</td>
                    <td>{formatNumber(segment.count)}</td>
                    <td>{formatCurrency(segment.revenue)}</td>
                    <td><div className="progress-bar"><div className="progress-fill" style={{ width: `${segment.percentage}%` }}></div></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="performance-section">
        <h2 className="section-title"><i className="fas fa-gauge-high"></i> Chỉ Số Hiệu Suất</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header"><h4 className="metric-title">Thời gian xử lý đơn hàng</h4></div>
            <div className="metric-value">2.4 giờ</div>
            <div className="metric-comparison"><span>Mục tiêu: 2 giờ</span><span className="trend-down">+0.4 giờ</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-header"><h4 className="metric-title">Tỷ lệ hài lòng khách hàng</h4></div>
            <div className="metric-value">94.2%</div>
            <div className="metric-comparison"><span>Mục tiêu: 95%</span><span className="trend-up">+2.1%</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-header"><h4 className="metric-title">Tỷ lệ trả hàng</h4></div>
            <div className="metric-value">2.1%</div>
            <div className="metric-comparison"><span>Trung bình ngành: 3.5%</span><span className="trend-up">-0.3%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
