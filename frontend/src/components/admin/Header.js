// frontend/src/components/admin/Header.js
import React from 'react';
import './Header.css';

const Header = ({ userAvatar, userName, onLogout, onMenuToggle }) => {
  return (
    <header className="admin-header">
      <div className="admin-nav-container">
        <div className="admin-logo">Handmade<span>Store</span></div>
        
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="nav-right">
          <div className="user-info">
            <div className="user-avatar">
              {typeof userAvatar === 'string' && userAvatar.length === 1 
                ? userAvatar 
                : <i className="fas fa-user"></i>}
            </div>
            <span>{userName}</span>
          </div>
          
          <button className="logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;