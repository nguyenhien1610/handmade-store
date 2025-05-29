const crypto = require('crypto');
const db = require('../../config/database');

// Hàm hash mật khẩu bằng SHA256 thông thường
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Đăng ký người dùng
exports.register = (req, res) => {
  console.log('=== ĐĂNG KÝ CLIENT ===');
  console.log('Data nhận được:', req.body);
  
  const { fullName, email, phone, password } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đầy đủ thông tin"
    });
  }

  // Kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Email không hợp lệ"
    });
  }

  // Kiểm tra định dạng số điện thoại
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Số điện thoại không hợp lệ (cần 10-11 số)"
    });
  }

  try {
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = db.prepare("SELECT * FROM Users WHERE email = ?").get(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng"
      });
    }

    // Kiểm tra xem số điện thoại đã tồn tại chưa
    const existingPhone = db.prepare("SELECT * FROM Users WHERE sdt = ?").get(phone);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã được sử dụng"
      });
    }

    // Hash mật khẩu bằng SHA256
    const hashedPassword = hashPassword(password);
    const createdAt = new Date().toISOString();
    
    // Tạo username từ email (phần trước @)
    const username = email.split('@')[0];

    // Tạo người dùng mới - sử dụng cấu trúc bảng Users mới
    const insertUser = db.prepare(`
      INSERT INTO Users (username, password, email, hoten, sdt, vaitro, ngaytao) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(username, hashedPassword, email, fullName, phone, 'client', createdAt);

    console.log('✅ Đăng ký thành công, User ID:', result.lastInsertRowid);

    // Trả về thông báo thành công
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký:", error);
    return res.status(500).json({
      success: false,
      message: "Đăng ký thất bại",
      error: error.message
    });
  }
};

// Đăng nhập
exports.login = (req, res) => {
  console.log('=== ĐĂNG NHẬP CLIENT ===');
  console.log('Data nhận được:', req.body);
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đầy đủ thông tin"
    });
  }

  try {
    // Tìm người dùng theo email
    const user = db.prepare("SELECT * FROM Users WHERE email = ?").get(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    // Kiểm tra mật khẩu bằng cách hash và so sánh
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    // Chuyển đổi tên trường để phù hợp với client
    const userForClient = {
      id: user.id_user,
      fullName: user.hoten,
      email: user.email,
      phone: user.sdt,
      role: user.vaitro,
      createdAt: user.ngaytao
    };

    const token = 'client-token-' + Date.now();

    console.log('✅ Đăng nhập thành công:', userForClient.email);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      user: userForClient,
      token: token
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập:", error);
    return res.status(500).json({
      success: false,
      message: "Đăng nhập thất bại",
      error: error.message
    });
  }
};