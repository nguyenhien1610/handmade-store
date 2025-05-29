// src/pages/admin/dashboard/components/RecentOrders.js
import React from 'react';
import './RecentOrders.css';

const RecentOrders = () => {
  const orders = [
    {
      id: '#DH001',
      customer: 'Nguyễn Thị Hương',
      date: '15/05/2025',
      status: 'CHỜ XỬ LÝ',
      statusClass: 'status-pending'
    },
    {
      id: '#DH002',
      customer: 'Trần Văn Minh',
      date: '14/05/2025',
      status: 'ĐÃ XÁC NHẬN',
      statusClass: 'status-confirmed'
    },
    {
      id: '#DH003',
      customer: 'Lê Thị Mai',
      date: '13/05/2025',
      status: 'ĐANG GIAO',
      statusClass: 'status-shipping'
    },
    {
      id: '#DH004',
      customer: 'Phạm Văn Long',
      date: '12/05/2025',
      status: 'HOÀN THÀNH',
      statusClass: 'status-completed'
    },
    {
      id: '#DH005',
      customer: 'Hoàng Thị Lan',
      date: '11/05/2025',
      status: 'ĐÃ HỦY',
      statusClass: 'status-cancelled'
    }
  ];

  return (
    <table className="recent-orders-table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách hàng</th>
          <th>Ngày</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order, index) => (
          <tr key={index}>
            <td>{order.id}</td>
            <td>{order.customer}</td>
            <td>{order.date}</td>
            <td>
              <span className={`status-badge ${order.statusClass}`}>
                {order.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default RecentOrders;