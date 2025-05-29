import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { clientUser, clientLogout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setShowDropdown(false);
    }, 300); // Độ trễ 300ms trước khi ẩn menu
    setTimeoutId(id);
  };

  const handleLogout = () => {
    clientLogout();
    navigate('/');
  };

  const handleCartClick = (e) => {
    if (!clientUser) {
      e.preventDefault();
      navigate('/dang-nhap');
    }
  };

  return (
    <header className="client-header">
      <div className="nav-container client-nav-container">
        <Link to="/" className="logo">
          Handmade<span>Store</span>
        </Link>
        <nav>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/san-pham">Sản phẩm</Link></li>
            <li><Link to="/ve-chung-toi">Về chúng tôi</Link></li>
            <li><Link to="/lien-he">Liên hệ</Link></li>
          </ul>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/gio-hang" className="cart-icon" onClick={handleCartClick}>
            <i className="fas fa-shopping-cart"></i>
          </Link>
          {clientUser ? (
            <div 
              className="user-dropdown"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="user-icon">
                <i className="fas fa-user-circle"></i>
              </div>
              {showDropdown && (
                <div 
                  className="dropdown-content"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link to="/tai-khoan">
                    <i className="fas fa-user"></i> Tài khoản của tôi
                  </Link>
                  <Link to="/don-hang">
                    <i className="fas fa-shopping-bag"></i> Đơn hàng của tôi
                  </Link>
                  <Link to="/yeu-thich">
                    <i className="far fa-heart"></i> Sản phẩm yêu thích
                  </Link>
                  <Link to="/dia-chi">
                    <i className="fas fa-address-book"></i> Sổ địa chỉ
                  </Link>
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}>
                    <i className="fas fa-sign-out-alt"></i> Đăng xuất
                  </a>
                </div>
              )}
            </div>
          ) : (
            <Link to="/dang-nhap" className="user-icon">
              <i className="fas fa-user-circle"></i>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;