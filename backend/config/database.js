// config/database.js
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Đường dẫn đến file database
const dbPath = path.resolve(__dirname, '../data/handmade_store.db');

// Đảm bảo thư mục data tồn tại
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`✅ Đã tạo thư mục ${dataDir}`);
}

// Hiển thị đường dẫn đầy đủ đến file database
console.log(`📁 Đường dẫn database: ${dbPath}`);

// Tạo kết nối database
try {
  const db = sqlite3(dbPath);
  console.log('✅ Đã kết nối CSDL bằng better-sqlite3');
  module.exports = db;
} catch (error) {
  console.error('❌ Lỗi kết nối database:', error.message);
  process.exit(1); // Thoát ứng dụng nếu không kết nối được database
}