import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import SocialLogin from '../../../components/client/SocialLogin/SocialLogin';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { clientLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập!');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Gửi dữ liệu đăng nhập:', { email: formData.email });
      
      const response = await clientLogin(formData.email, formData.password);
      console.log('Phản hồi từ server:', response);
      
      if (response.success) {
        alert('Đăng nhập thành công!');
        navigate('/');
      } else {
        setError(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy trên port 5000 không?');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLoginSuccess = (provider, data) => {
    console.log(`Đăng nhập ${provider} thành công:`, data);
    // Xử lý logic sau khi đăng nhập thành công
    // Có thể gọi API backend để xác thực và lưu thông tin user
    alert(`Đăng nhập với ${provider} thành công!`);
    // navigate('/');
  };

  return (
    <div className="login-container">
        <h2 className="section-title">Đăng nhập</h2>
        
        <div className="login-illustration">
          🔑
        </div>
        
        {error && (
          <div className="error-message" style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            color: '#e74c3c',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email hoặc số điện thoại</label>
            <div className="input-with-icon">
              <input 
                type="email" 
                id="email" 
                name="email"
                className="form-control" 
                placeholder="Nhập email hoặc số điện thoại" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
              <span className="input-icon">
                <i className="fas fa-user"></i>
              </span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-with-icon">
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="password" 
                name="password"
                className="form-control" 
                placeholder="Nhập mật khẩu" 
                value={formData.password}
                onChange={handleChange}
                required 
              />
              <span className="input-icon password-toggle" onClick={togglePassword}>
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
            </div>
          </div>
          
          <div className="remember-forgot">
            <div className="form-check">
              <input 
                type="checkbox" 
                id="rememberMe" 
                name="rememberMe"
                className="form-check-input"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe" className="form-check-label">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link to="/quen-mat-khau" className="forgot-password">Quên mật khẩu?</Link>
          </div>
          
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        
        <SocialLogin onSuccess={handleSocialLoginSuccess} />
        
        <div className="register-link">
          Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
        </div>
    </div>
  );
};

export default Login;
