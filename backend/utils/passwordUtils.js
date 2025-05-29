const crypto = require('crypto');

// Hàm tạo hash đơn giản với SHA-256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Hàm so sánh mật khẩu đơn giản
const comparePassword = (password, hash) => {
  const hashedPassword = hashPassword(password);
  // Thêm log để debug
  console.log('Password đầu vào:', password);
  console.log('Hash từ mật khẩu đầu vào:', hashedPassword);
  console.log('Hash đã lưu:', hash);
  console.log('Kết quả so sánh:', hashedPassword === hash);
  return hashedPassword === hash;
};

module.exports = {
  hashPassword,
  comparePassword
};