const db = require('../../config/database');

// Các phương thức thao tác với bảng Users
const User = {
  // Tìm tất cả users (chỉ lấy client)
  findAllClients: () => {
    const sql = `
      SELECT id_user as id, hoten as fullName, email, sdt as phone, 
             vaitro as role, ngaytao as createdAt
      FROM Users 
      WHERE vaitro = 'client'
    `;
    
    try {
      return db.prepare(sql).all();
    } catch (error) {
      console.error("Error finding all clients:", error);
      throw error;
    }
  },

  // Tìm user theo id
  findById: (id) => {
    try {
      return db.prepare("SELECT * FROM Users WHERE id_user = ?").get(id);
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  },

  // Tìm user theo email
  findByEmail: (email) => {
    try {
      return db.prepare("SELECT * FROM Users WHERE email = ?").get(email);
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  },

  // Tìm user theo số điện thoại
  findByPhone: (phone) => {
    try {
      return db.prepare("SELECT * FROM Users WHERE sdt = ?").get(phone);
    } catch (error) {
      console.error("Error finding user by phone:", error);
      throw error;
    }
  },

  // Tạo user mới
  create: (userData) => {
    const { fullName, email, phone, password, role } = userData;
    const username = email.split('@')[0]; // Tạo username từ email
    const createdAt = new Date().toISOString();
    
    const sql = `
      INSERT INTO Users (username, password, email, hoten, sdt, vaitro, ngaytao) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = db.prepare(sql).run(username, password, email, fullName, phone, role || 'client', createdAt);
      return result.lastInsertRowid;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Cập nhật thông tin user
  update: (id, userData) => {
    const { fullName, phone } = userData;
    
    const sql = `
      UPDATE Users 
      SET hoten = ?, sdt = ?
      WHERE id_user = ?
    `;
    
    try {
      const result = db.prepare(sql).run(fullName, phone, id);
      return result.changes;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Cập nhật mật khẩu
  updatePassword: (id, password) => {
    const sql = `
      UPDATE Users 
      SET password = ?
      WHERE id_user = ?
    `;
    
    try {
      const result = db.prepare(sql).run(password, id);
      return result.changes;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  // Xóa user
  delete: (id) => {
    try {
      const result = db.prepare("DELETE FROM Users WHERE id_user = ?").run(id);
      return result.changes;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
};

module.exports = User;