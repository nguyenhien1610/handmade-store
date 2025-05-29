import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import profileService from '../../../api/profileService';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    hoten: '',
    email: '',
    sdt: '',
    diachi: '',
    username: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setFormData({
        hoten: response.user.hoten || '',
        email: response.user.email || '',
        sdt: response.user.sdt || '',
        diachi: response.user.diachi || '',
        username: response.user.username || ''
      });
    } catch (error) {
      setError('Không thể tải thông tin tài khoản');
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await profileService.updateProfile({
        hoten: formData.hoten,
        email: formData.email,
        sdt: formData.sdt,
        diachi: formData.diachi
      });
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.error || 'Có lỗi xảy ra khi cập nhật thông tin');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.error || 'Có lỗi xảy ra khi đổi mật khẩu');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div className="profile-loading">Đang tải...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="page-title">Tài khoản của tôi</h1>
        
        <div className="account-container">
          {/* Sidebar */}
          <div className="account-sidebar">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div>
                <div className="user-name">{formData.hoten || formData.username}</div>
                <div className="user-email">{formData.email}</div>
              </div>
            </div>
            
            <ul className="sidebar-menu">
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'info' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('info');
                  }}
                >
                  <i className="fas fa-user"></i> Thông tin tài khoản
                </a>
              </li>
              <li>
                <Link to="/don-hang">
                  <i className="fas fa-shopping-bag"></i> Đơn hàng của tôi
                </Link>
              </li>
              <li>
                <Link to="/yeu-thich">
                  <i className="far fa-heart"></i> Sản phẩm yêu thích
                </Link>
              </li>
              <li>
                <Link to="/dia-chi">
                  <i className="fas fa-map-marker-alt"></i> Sổ địa chỉ
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}>
                  <i className="fas fa-sign-out-alt"></i> Đăng xuất
                </a>
              </li>
            </ul>
          </div>
          
          {/* Main Content */}
          <div className="account-content">
            <h2 className="content-title">Thông tin tài khoản</h2>
            
            {/* Alerts */}
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}
            
            {/* Personal Information Form */}
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Tên đăng nhập</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.username}
                  disabled
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="hoten"
                  value={formData.hoten}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  name="sdt"
                  value={formData.sdt}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="diachi"
                  value={formData.diachi}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn">
                  Cập nhật thông tin
                </button>
              </div>
            </form>
            
            {/* Password Section */}
            <div className="password-section">
              <h3 className="content-title">Thay đổi mật khẩu</h3>
              
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nhập lại mật khẩu mới</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <button type="submit" className="btn">
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;