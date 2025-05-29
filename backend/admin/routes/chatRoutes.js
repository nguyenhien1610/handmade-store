// \handmade-store\backend\admin\routes\chatRoutes.js
const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');

// Middleware để verify admin (tùy chọn)
const verifyAdmin = (req, res, next) => {
  // Implement authentication logic here
  // For now, just pass through
  next();
};

// Middleware để validate input
const validateChatInput = (req, res, next) => {
  const { chatId, message } = req.body;
  
  if (req.method === 'POST' && req.path.includes('/send')) {
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID là bắt buộc'
      });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống'
      });
    }
  }
  
  next();
};

// ============================================================================
// ADMIN CHAT ROUTES
// ============================================================================

/**
 * @route   GET /api/admin/chats
 * @desc    Lấy danh sách tất cả cuộc trò chuyện
 * @access  Admin
 */
router.get('/', verifyAdmin, ChatController.getAllChats);

/**
 * @route   GET /api/admin/chats/search
 * @desc    Tìm kiếm cuộc trò chuyện theo tên khách hàng
 * @access  Admin
 * @param   {string} q - Từ khóa tìm kiếm
 */
router.get('/search', verifyAdmin, ChatController.searchChats);

/**
 * @route   GET /api/admin/chats/stats
 * @desc    Lấy thống kê tổng quan về chat
 * @access  Admin
 */
router.get('/stats', verifyAdmin, ChatController.getChatStats);

/**
 * @route   GET /api/admin/chats/:chatId/messages
 * @desc    Lấy tất cả tin nhắn của một cuộc trò chuyện
 * @access  Admin
 * @param   {number} chatId - ID của cuộc trò chuyện (user ID)
 */
router.get('/:chatId/messages', verifyAdmin, ChatController.getMessages);

/**
 * @route   GET /api/admin/chats/:chatId/info
 * @desc    Lấy thông tin chi tiết của một cuộc trò chuyện
 * @access  Admin
 * @param   {number} chatId - ID của cuộc trò chuyện (user ID)
 */
router.get('/:chatId/info', verifyAdmin, ChatController.getChatInfo);

/**
 * @route   GET /api/admin/chats/:chatId/export
 * @desc    Export lịch sử chat
 * @access  Admin
 * @param   {number} chatId - ID của cuộc trò chuyện (user ID)
 * @param   {string} format - Định dạng export (json, csv)
 */
router.get('/:chatId/export', verifyAdmin, ChatController.exportChatHistory);

/**
 * @route   POST /api/admin/chats/send
 * @desc    Gửi tin nhắn mới
 * @access  Admin
 * @body    {number} chatId - ID của cuộc trò chuyện (user ID)
 * @body    {string} message - Nội dung tin nhắn
 * @body    {string} sender - Người gửi (admin/customer)
 */
router.post('/send', verifyAdmin, validateChatInput, ChatController.sendMessage);

/**
 * @route   POST /api/admin/chats/auto-message
 * @desc    Gửi tin nhắn tự động từ template
 * @access  Admin
 * @body    {number} chatId - ID của cuộc trò chuyện (user ID)
 * @body    {string} templateType - Loại template (welcome, closing, offline, support_hours)
 */
router.post('/auto-message', verifyAdmin, ChatController.sendAutoMessage);

/**
 * @route   PUT /api/admin/chats/:chatId/read
 * @desc    Đánh dấu cuộc trò chuyện đã được đọc
 * @access  Admin
 * @param   {number} chatId - ID của cuộc trò chuyện (user ID)
 */
router.put('/:chatId/read', verifyAdmin, ChatController.markAsRead);

/**
 * @route   DELETE /api/admin/chats/messages/:messageId
 * @desc    Xóa một tin nhắn cụ thể
 * @access  Admin
 * @param   {number} messageId - ID của tin nhắn
 */
router.delete('/messages/:messageId', verifyAdmin, ChatController.deleteMessage);

// ============================================================================
// CUSTOMER CHAT ROUTES (có thể tách ra file riêng)
// ============================================================================

/**
 * @route   POST /api/customer/chat/send
 * @desc    Khách hàng gửi tin nhắn
 * @access  Customer
 * @body    {string} message - Nội dung tin nhắn
 */
router.post('/customer/send', async (req, res) => {
  try {
    const { message } = req.body;
    const customerId = req.user?.id || req.body.customerId; // Từ token hoặc session

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để gửi tin nhắn'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống'
      });
    }

    const newMessage = await ChatController.sendMessage({
      body: {
        chatId: customerId,
        message: message.trim(),
        sender: 'customer'
      }
    }, res);

  } catch (error) {
    console.error('Lỗi khi khách hàng gửi tin nhắn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/customer/chat/history
 * @desc    Khách hàng lấy lịch sử chat của mình
 * @access  Customer
 */
router.get('/customer/history', async (req, res) => {
  try {
    const customerId = req.user?.id || req.query.customerId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xem lịch sử chat'
      });
    }

    await ChatController.getMessages({
      params: { chatId: customerId }
    }, res);

  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Middleware xử lý lỗi cho route chat
router.use((error, req, res, next) => {
  console.error('Chat Route Error:', error);
  
  if (error.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      error: error.message
    });
  }
  
  if (error.type === 'authorization') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Lỗi server không xác định',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
  });
});

module.exports = router;