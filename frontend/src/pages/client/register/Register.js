
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SocialLogin from '../../../components/client/SocialLogin/SocialLogin';
import './Register.css';

const Register = () => {
  useEffect(() => {
    document.title = 'Đăng ký - Handmade Store';
  }, []);

  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Xóa lỗi khi user bắt đầu nhập
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };
  
  const togglePasswordVisibility = (fieldId) => {
    const passwordField = document.getElementById(fieldId);
    const icon = document.querySelector(`#${fieldId} ~ .input-icon .fas`);
    
    if (passwordField && icon) {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordField.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (cần 10-11 số)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu cần ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Bạn cần đồng ý với điều khoản sử dụng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSocialLoginSuccess = (provider, data) => {
    console.log(`Đăng ký với ${provider} thành công:`, data);
    // Xử lý logic sau khi đăng ký thành công
    alert(`Đăng ký với ${provider} thành công!`);
    // navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('Gửi dữ liệu đăng ký:', formData);
      
      // Sử dụng URL tương đối thay vì URL tuyệt đối
      const response = await fetch('/api/client/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });
      
      if (!response.ok) {
        // Kiểm tra xem response có phải là JSON không
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || `Lỗi ${response.status}: ${response.statusText}`);
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('Phản hồi từ server:', data);
      
      if (data.success) {
        alert('Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.');
        navigate('/dang-nhap');
      } else {
        setErrors({
          submit: data.message || 'Đăng ký thất bại'
        });
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      setErrors({
        submit: error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không?'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-wrapper">
      <div className="register-container">
        <h2 className="register-title">Đăng ký tài khoản</h2>
        
        <div className="register-illustration">
          <i className="fas fa-gift" style={{fontSize: '64px', color: '#ff9aa2'}}></i>
        </div>
        
        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-control ${errors.fullName ? 'error' : ''}`}
                placeholder="Nhập họ và tên của bạn"
                value={formData.fullName}
                onChange={handleChange}
              />
              <span className="input-icon"><i className="fas fa-user"></i></span>
            </div>
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="Nhập địa chỉ email của bạn"
                value={formData.email}
                onChange={handleChange}
              />
              <span className="input-icon"><i className="fas fa-envelope"></i></span>
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <div className="input-wrapper">
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-control ${errors.phone ? 'error' : ''}`}
                placeholder="Nhập số điện thoại của bạn"
                value={formData.phone}
                onChange={handleChange}
              />
              <span className="input-icon"><i className="fas fa-phone"></i></span>
            </div>
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Tạo mật khẩu mới (ít nhất 6 ký tự)"
                value={formData.password}
                onChange={handleChange}
              />
              <span 
                className="input-icon password-toggle" 
                onClick={() => togglePasswordVisibility('password')}
              >
                <i className="fas fa-eye"></i>
              </span>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
            <div className="password-requirements">
              Mật khẩu cần ít nhất 6 ký tự
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <span 
                className="input-icon password-toggle" 
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                <i className="fas fa-eye"></i>
              </span>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
          
          <div className={`terms-checkbox ${errors.agreeTerms ? 'error' : ''}`}>
            <label>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
              <span>Tôi đồng ý với </span>
              <a href="#" className="terms-link">Điều khoản sử dụng</a>
              <span> và </span>
              <a href="#" className="terms-link">Chính sách bảo mật</a>
            </label>
            {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
          </div>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
          </button>
        </form>
        
        <SocialLogin onSuccess={handleSocialLoginSuccess} />
        
        <div className="login-link">
          Bạn đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
