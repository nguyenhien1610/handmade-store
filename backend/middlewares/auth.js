const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware xác thực token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token không được cung cấp'
    });
  }

  try {
    // Xác thực token (synchronous)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user trong DB
    const userExists = db.prepare(
      'SELECT id_user, hoten, email, trang_thai FROM Users WHERE id_user = ?'
    ).get(decoded.id_user);

    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    if (userExists.trang_thai !== 'hoat_dong') {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    req.user = userExists; // ✅ Lưu thông tin user đã xác thực
    next();
  } catch (err) {
    console.error('Token hoặc DB lỗi:', err);
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc lỗi server'
    });
  }
};
// Middleware kiểm tra role (nếu cần)
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    const userRole = req.user.role;
    if (Array.isArray(requiredRoles)) {
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền thực hiện hành động này'
        });
      }
    } else {
      if (userRole !== requiredRoles) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền thực hiện hành động này'
        });
      }
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole
};