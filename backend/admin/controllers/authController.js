const Database = require('../../config/database');
const { hashPassword, comparePassword } = require('../../utils/passwordUtils');
const db = Database;

// Thông tin admin
const ADMIN_USERNAME = 'admin';
// Hash đơn giản của 'admin123'
const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

const login = (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu'
    });
  }

  try {
    // Kiểm tra username
    if (username === ADMIN_USERNAME) {
      // So sánh mật khẩu (đây là hàm đồng bộ, không cần async/await)
      const passwordMatches = comparePassword(password, ADMIN_PASSWORD_HASH);
      
      if (passwordMatches) {
        return res.status(200).json({
          success: true,
          message: 'Đăng nhập thành công',
          user: {
            username: ADMIN_USERNAME,
            role: 'admin'
          },
          token: 'simple-token-' + Date.now()
        });
      }
    }
    
    return res.status(401).json({
      success: false,
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập, vui lòng thử lại'
    });
  }
};

const checkAuth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Đã xác thực',
    user: {
      username: ADMIN_USERNAME,
      role: 'admin'
    }
  });
};

module.exports = {
  login,
  checkAuth
};