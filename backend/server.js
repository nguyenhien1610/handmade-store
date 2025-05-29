const express = require('express');
const cors = require('cors');
const http = require('http');
const { initializeSocket } = require('./socketServer');

const app = express();
const server = http.createServer(app);
const PORT = 5000;

// Initialize Socket.IO
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Import các route
const adminAuthRoutes = require('./admin/routes/authRoutes');
const adminOrderRoutes = require('./admin/routes/orderRoutes');
const adminReportRoutes = require ('./admin/routes/reportRoutes');
const adminChatRoutes = require ('./admin/routes/chatRoutes');
const socialMediaRoutes = require('./admin/routes/socialMediaRoutes');
const productRoutes = require('./admin/routes/productRoutes');
const categoryRoutes = require('./admin/routes/categoryRoutes');
const labelRoutes = require('./admin/routes/labelRoutes');
const clientAuthRoutes = require('./client/routes/authRoutes');
const clientUserRoutes = require('./client/routes/userRoutes');
const clientProfileRoutes = require('./client/routes/profileRoutes');
const clientCartRoutes = require('./client/routes/cartRoutes');
const clientorderRoutes = require('./client/routes/orderRoutes');
const clientChatRoutes = require('./client/routes/chatRoutes');

// Thêm đoạn debug để kiểm tra database
const db = require('./config/database');

// Kiểm tra bảng Users
const checkUsersTable = () => {
  try {
    // Kiểm tra bảng có tồn tại không
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'").get();
    
    if (!tableExists) {
      console.warn('⚠️ Bảng Users không tồn tại trong database');
    } else {
      // Nếu bảng tồn tại, kiểm tra cấu trúc
      const tableInfo = db.prepare("PRAGMA table_info(Users)").all();
      console.log('📋 Cấu trúc bảng Users:', tableInfo.map(col => col.name));
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra bảng Users:', error.message);
  }
};

// Sử dụng routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/social-media', socialMediaRoutes);
app.use('/api/admin/categories', categoryRoutes); 
app.use('/api/admin/labels', labelRoutes);
app.use('/api/admin/products', productRoutes); 
app.use('/api/admin/chats', adminChatRoutes); 
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/reports', adminReportRoutes);

app.use('/api/client/auth', clientAuthRoutes);
app.use('/api/client/users', clientUserRoutes);
app.use('/api/client/profile', clientProfileRoutes);
app.use('/api/client/cart', clientCartRoutes);
app.use('/api/client/orders', clientorderRoutes);
app.use('/api/client/chat', clientChatRoutes);

// API test
app.get('/api', (req, res) => {
  res.json({ message: 'API đang chạy' });
});

// Khởi động server
server.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server is ready`);
  
  // Kiểm tra cấu trúc bảng Users khi khởi động
  checkUsersTable();
});

// Trước khi import và sử dụng routes
console.log('🚀 Đang khởi động server...');

// Import các route với try/catch để xác định lỗi chính xác
try {
  const clientAuthRoutes = require('./client/routes/authRoutes');
  console.log('✅ clientAuthRoutes loaded, type:', typeof clientAuthRoutes);
  app.use('/api/client/auth', clientAuthRoutes);
} catch (error) {
  console.error('❌ Error loading clientAuthRoutes:', error.message);
  console.error(error.stack);
}
