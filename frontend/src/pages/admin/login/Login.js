// frontend/src/pages/admin/login/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { adminLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy URL chuyển hướng từ location state hoặc mặc định là dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Add class to body when component mounts
  useEffect(() => {
    document.body.classList.add('admin-login-page-body');
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('admin-login-page-body');
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Gọi hàm login từ AuthContext
      const result = await adminLogin(username, password);
      
      if (result.success) {
        // Đăng nhập thành công, chuyển hướng đến trang đích
        navigate(from, { replace: true });
      } else {
        // Trường hợp API trả về success: false
        setError(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      // Xử lý lỗi từ API hoặc lỗi mạng
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau!'
      );
      
      // Xóa thông báo lỗi sau 5 giây
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // TODO: Thêm xử lý quên mật khẩu sau này
    alert('Tính năng quên mật khẩu đang được phát triển!');
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-container">
        {/* Image Side */}
        <div className="login-image">
          <div className="pattern"></div>
          <div className="login-image-content">
            <div className="handmade-icon">
              <i className="fas fa-heart"></i>
            </div>
            <h2>Handmade Store</h2>
            <p>Hệ thống quản lý dành cho cửa hàng sản phẩm thủ công mỹ nghệ. Đăng nhập để tiếp tục quản lý cửa hàng của bạn.</p>
          </div>
        </div>
        
        {/* Form Side */}
        <div className="login-form">
          <div className="login-header">
            <div className="logo">Handmade<span>Store</span></div>
            <h2 className="login-title">Đăng nhập quản trị</h2>
            <p className="login-subtitle">Vui lòng đăng nhập để truy cập hệ thống</p>
          </div>
          
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <div className="input-field">
                <input 
                  type="text" 
                  id="username" 
                  placeholder="Nhập tên đăng nhập" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required 
                />
                <i className="fas fa-user"></i>
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-field">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="Nhập mật khẩu" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required 
                />
                <i className="fas fa-lock"></i>
                <i 
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`} 
                  onClick={togglePasswordVisibility}
                ></i>
              </div>
            </div>
            
            <div className="options">
              <div className="remember-me">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="remember">Ghi nhớ đăng nhập</label>
              </div>
              <a 
                href="#" 
                className="forgot-password"
                onClick={handleForgotPassword}
              >
                Quên mật khẩu?
              </a>
            </div>
            
            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Đăng nhập
                </>
              )}
            </button>
          </form>
          
          <div className="login-footer">
            &copy; 2025 Handmade Store. Đã đăng ký bản quyền.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;