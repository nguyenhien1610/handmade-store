// src/pages/admin/dashboard/components/OrderStatusChart.js
import React from 'react';
import './OrderStatusChart.css';

const OrderStatusChart = () => {
  const orderStats = [
    { label: 'Chờ xử lý', value: 25, percentage: 10, color: '#ff9800' }, // Màu cam
    { label: 'Đang xử lý', value: 37, percentage: 15, color: '#2196F3' }, // Màu xanh dương
    { label: 'Hoàn thành', value: 161, percentage: 65, color: '#4CAF50' }, // Màu xanh lá
    { label: 'Đã hủy', value: 25, percentage: 10, color: '#f44336' }  // Màu đỏ
  ];

  const totalOrders = orderStats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <div className="order-status-chart">
      <div className="donut-chart-container">
        <div className="donut-chart">
          <div className="donut-hole">
            <div className="total-orders">{totalOrders}</div>
            <div className="total-label">Đơn hàng</div>
          </div>
        </div>
      </div>
      <div className="chart-legend">
        {orderStats.map((stat, index) => (
          <div key={index} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: stat.color }}></div>
            <div className="legend-text">{stat.label}</div>
            <div className="legend-number">{stat.value} ({stat.percentage}%)</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusChart;