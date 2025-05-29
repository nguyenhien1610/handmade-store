// handmade-store\backend\client\routes\chatRoutes.js
const express = require('express');
const router = express.Router();
const ClientChatController = require('../controllers/chatController');
const { authenticateToken } = require('../../middlewares/auth');

// Middleware xác thực cho tất cả routes (có thể optional cho một số route)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    // Nếu có token thì validate
    authenticateToken(req, res, next);
  } else {
    // Nếu không có token thì cho phép tiếp tục (guest user)
    next();
  }
};

// Routes cho chức năng chat

// 1. Bắt đầu cuộc trò chuyện hoặc lấy lịch sử chat
router.post('/start', authenticateToken, ClientChatController.startChat);

// 2. Gửi tin nhắn
router.post('/send', authenticateToken, ClientChatController.sendMessage);

// 3. Lấy lịch sử chat
router.get('/history', authenticateToken, ClientChatController.getChatHistory);

// 4. Lấy trạng thái chat (admin online/offline)
router.get('/status', ClientChatController.getChatStatus);

// 5. Đánh dấu tin nhắn đã đọc
router.post('/mark-read', authenticateToken, ClientChatController.markMessagesAsRead);

// 6. Lấy số lượng tin nhắn chưa đọc
router.get('/unread-count', authenticateToken, ClientChatController.getUnreadCount);

// 7. Gửi thông tin đang typing
router.post('/typing', authenticateToken, ClientChatController.sendTyping);

// 8. Lấy các câu hỏi nhanh (template)
router.get('/quick-questions', ClientChatController.getQuickQuestions);

// 9. Tìm kiếm tin nhắn trong lịch sử
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    const customerId = req.user?.id_user;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    if (!searchTerm || !searchTerm.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Từ khóa tìm kiếm không được để trống'
      });
    }

    const ClientChat = require('./models/ClientChat');
    const results = await ClientChat.searchMessages(customerId, searchTerm.trim());
    
    res.status(200).json({
      success: true,
      data: results,
      total: results.length,
      searchTerm: searchTerm.trim()
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm tin nhắn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm kiếm',
      error: error.message
    });
  }
});

// 10. Lấy tin nhắn theo khoảng thời gian
router.get('/messages/date-range', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customerId = req.user?.id_user;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp khoảng thời gian'
      });
    }

    const ClientChat = require('./models/ClientChat');
    const messages = await ClientChat.getMessagesByDateRange(customerId, startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: messages,
      total: messages.length,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn theo ngày:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// 11. Lấy thống kê chat của khách hàng
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user?.id_user;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const ClientChat = require('./models/ClientChat');
    const stats = await ClientChat.getCustomerChatStats(customerId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê chat:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// 12. Lấy tin nhắn mới nhất
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user?.id_user;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const ClientChat = require('./models/ClientChat');
    const latestMessage = await ClientChat.getLatestMessage(customerId);
    
    res.status(200).json({
      success: true,
      data: latestMessage
    });
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn mới nhất:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// 13. Kiểm tra có cuộc trò chuyện đang hoạt động không
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user?.id_user;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const ClientChat = require('./models/ClientChat');
    const hasActiveChat = await ClientChat.hasActiveChat(customerId);
    
    res.status(200).json({
      success: true,
      data: {
        hasActiveChat,
        customerId
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra chat đang hoạt động:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// 14. Ping để duy trì kết nối
router.post('/ping', optionalAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    user: req.user?.id_user || null
  });
});

// Error handling middleware cho routes
router.use((error, req, res, next) => {
  console.error('Chat Routes Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;