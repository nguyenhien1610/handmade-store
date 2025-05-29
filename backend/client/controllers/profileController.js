const db = require('../../config/database');
const bcrypt = require('bcrypt');

// Lấy thông tin profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id_user;
    
    const stmt = db.prepare('SELECT id_user, username, email, hoten, diachi, sdt, ngaytao FROM Users WHERE id_user = ?');
    const user = stmt.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Lỗi lấy thông tin profile:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Cập nhật thông tin profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { hoten, email, sdt, diachi } = req.body;
    
    // Kiểm tra email đã tồn tại chưa (ngoại trừ email hiện tại)
    const checkEmailStmt = db.prepare('SELECT id_user FROM Users WHERE email = ? AND id_user != ?');
    const existingUser = checkEmailStmt.get(email, userId);
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Cập nhật thông tin
    const updateStmt = db.prepare('UPDATE Users SET hoten = ?, email = ?, sdt = ?, diachi = ? WHERE id_user = ?');
    const result = updateStmt.run(hoten, email, sdt, diachi, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { currentPassword, newPassword } = req.body;
    
    // Kiểm tra mật khẩu mới
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    
    // Lấy mật khẩu hiện tại từ database
    const stmt = db.prepare('SELECT password FROM Users WHERE id_user = ?');
    const user = stmt.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }
    
    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu
    const updateStmt = db.prepare('UPDATE Users SET password = ? WHERE id_user = ?');
    updateStmt.run(hashedPassword, userId);
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};