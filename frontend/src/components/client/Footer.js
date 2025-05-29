import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-about">
          <div className="footer-logo">
            Handmade<span>Store</span>
          </div>
          <p>Handmade Store - Nơi mang đến những sản phẩm handmade chất lượng cao, được làm thủ công với tất cả tâm huyết và sự sáng tạo.</p>
          <div className="social-icons">
            <a href="#" className="social-icon">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="social-icon">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="social-icon">
              <i className="fas fa-store"></i>
            </a>
            <a href="#" className="social-icon">
              <i className="fab fa-tiktok"></i>
            </a>
          </div>
        </div>
        <div className="footer-links">
          <h3>Liên kết nhanh</h3>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/san-pham">Sản phẩm</Link></li>
            <li><Link to="/danh-muc">Danh mục</Link></li>
            <li><Link to="/ve-chung-toi">Về chúng tôi</Link></li>
            <li><Link to="/lien-he">Liên hệ</Link></li>
          </ul>
        </div>
        <div className="footer-links">
          <h3>Hỗ trợ</h3>
          <ul>
            <li><Link to="/chinh-sach-doi-tra">Chính sách đổi trả</Link></li>
            <li><Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link></li>
            <li><Link to="/dieu-khoan-dich-vu">Điều khoản dịch vụ</Link></li>
            <li><Link to="/phuong-thuc-thanh-toan">Phương thức thanh toán</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h3>Liên hệ</h3>
          <div className="contact-info">
            <p><span className="contact-icon"><i className="fas fa-map-marker-alt"></i></span> 123 Đường ABC, Quận XYZ, Hanoi</p>
            <p><span className="contact-icon"><i className="fas fa-phone"></i></span> +84 123 456 789</p>
            <p><span className="contact-icon"><i className="fas fa-envelope"></i></span> info@handmadestore.vn</p>
            <p><span className="contact-icon"><i className="fas fa-clock"></i></span> Thứ 2 - Thứ 7: 9h - 18h</p>
          </div>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; 2025 Handmade Store. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  );
};

export default Footer;