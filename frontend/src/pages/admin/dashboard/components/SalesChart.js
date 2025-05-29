// frontend/src/pages/admin/dashboard/components/SalesChart.js
import React from 'react';
import './SalesChart.css';

const SalesChart = ({ filter }) => {
  // Dữ liệu cho tuần (T2-CN)
  const weekData = [
    { label: 'T2', value: '28.2M', height: '60%' },
    { label: 'T3', value: '35.5M', height: '75%' },
    { label: 'T4', value: '21.1M', height: '45%' },
    { label: 'T5', value: '40.8M', height: '85%' },
    { label: 'T6', value: '45.0M', height: '95%' },
    { label: 'T7', value: '30.5M', height: '65%' },
    { label: 'CN', value: '38.7M', height: '80%' }
  ];

  // Dữ liệu cho ngày (24 giờ)
  const dayData = [
    { label: '0h', value: '1.2M', height: '20%' },
    { label: '2h', value: '0.8M', height: '15%' },
    { label: '4h', value: '0.5M', height: '10%' },
    { label: '6h', value: '2.1M', height: '30%' },
    { label: '8h', value: '5.5M', height: '50%' },
    { label: '10h', value: '8.3M', height: '70%' },
    { label: '12h', value: '9.8M', height: '85%' },
    { label: '14h', value: '7.6M', height: '65%' },
    { label: '16h', value: '10.2M', height: '90%' },
    { label: '18h', value: '11.5M', height: '95%' },
    { label: '20h', value: '8.9M', height: '75%' },
    { label: '22h', value: '4.3M', height: '40%' }
  ];

  // Dữ liệu cho tháng (30 ngày)
  const monthData = [
    { label: '1', value: '12.5M', height: '50%' },
    { label: '5', value: '18.3M', height: '70%' },
    { label: '10', value: '25.6M', height: '85%' },
    { label: '15', value: '22.1M', height: '75%' },
    { label: '20', value: '28.9M', height: '90%' },
    { label: '25', value: '30.2M', height: '95%' },
    { label: '30', value: '19.7M', height: '65%' }
  ];

  // Dữ liệu cho năm (12 tháng)
  const yearData = [
    { label: 'T1', value: '85.2M', height: '60%' },
    { label: 'T2', value: '92.5M', height: '65%' },
    { label: 'T3', value: '78.1M', height: '55%' },
    { label: 'T4', value: '105.8M', height: '75%' },
    { label: 'T5', value: '125.0M', height: '85%' },
    { label: 'T6', value: '118.5M', height: '80%' },
    { label: 'T7', value: '135.7M', height: '90%' },
    { label: 'T8', value: '142.3M', height: '95%' },
    { label: 'T9', value: '128.9M', height: '87%' },
    { label: 'T10', value: '115.2M', height: '78%' },
    { label: 'T11', value: '98.6M', height: '68%' },
    { label: 'T12', value: '108.4M', height: '73%' }
  ];

  // Chọn dữ liệu dựa trên filter
  let chartData;
  switch (filter) {
    case 'Ngày':
      chartData = dayData;
      break;
    case 'Tháng':
      chartData = monthData;
      break;
    case 'Năm':
      chartData = yearData;
      break;
    default:
      chartData = weekData;
  }

  // Hiển thị tối đa 7 cột cho mọi view
  const displayData = chartData.slice(0, filter === 'Ngày' ? 12 : 7);

  return (
    <div className="revenue-chart">
      {displayData.map((item, index) => (
        <div 
          key={index}
          className="revenue-bar" 
          style={{ height: item.height }} 
          data-value={item.value} 
          data-label={item.label}
        ></div>
      ))}
      <div className="chart-axis"></div>
    </div>
  );
};

export default SalesChart;