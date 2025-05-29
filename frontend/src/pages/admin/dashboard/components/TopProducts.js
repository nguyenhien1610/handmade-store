// src/pages/admin/dashboard/components/TopProducts.js
import React from 'react';
import './TopProducts.css';

const TopProducts = () => {
  const products = [
    {
      name: 'Túi xách thủ công',
      category: 'Phụ kiện',
      price: '350.000đ',
      sales: '28 đã bán'
    },
    {
      name: 'Vòng tay handmade',
      category: 'Trang sức',
      price: '120.000đ',
      sales: '45 đã bán'
    },
    {
      name: 'Hộp quà trang trí',
      category: 'Quà tặng',
      price: '185.000đ',
      sales: '37 đã bán'
    },
    {
      name: 'Bộ thiệp handmade',
      category: 'Văn phòng phẩm',
      price: '95.000đ',
      sales: '56 đã bán'
    },
    {
      name: 'Móc khóa thủ công',
      category: 'Phụ kiện',
      price: '65.000đ',
      sales: '72 đã bán'
    }
  ];

  return (
    <ul className="top-products-list">
      {products.map((product, index) => (
        <li key={index} className="product-item">
          <div className="product-img">
            <i className="fas fa-gift"></i>
          </div>
          <div className="product-details">
            <div className="product-name">{product.name}</div>
            <div className="product-category">{product.category}</div>
          </div>
          <div className="product-stats">
            <div className="product-price">{product.price}</div>
            <div className="product-sales">{product.sales}</div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TopProducts;