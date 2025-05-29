// \handmade-store\backend\admin\controllers\chatController.js
const Chat = require('../models/Chat');
const { getIO } = require('../../socketServer');

class ChatController {
  // Lấy danh sách tất cả cuộc trò chuyện
  static async getAllChats(req, res) {
    try {
      const chats = await Chat.getAllChats();
      res.status(200).json(chats);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách chat',
        error: error.message
      });
    }
  }

  // Lấy tin nhắn của một cuộc trò chuyện
  static async getMessages(req, res) {
    try {
      const { chatId } = req.params;
      
      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: 'Chat ID là bắt buộc'
        });
      }

      const messages = await Chat.getMessagesByUserId(chatId);
      res.status(200).json(messages);
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tin nhắn',
        error: error.message
      });
    }
  }

  // Gửi tin nhắn mới với Socket.IO
  static async sendMessage(req, res) {
    try {
      const { chatId, message, sender = 'admin' } = req.body;

      // Validation
      if (!chatId || !message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Chat ID và nội dung tin nhắn là bắt buộc'
        });
      }

      if (!['admin', 'customer'].includes(sender)) {
        return res.status(400).json({
          success: false,
          message: 'Sender phải là admin hoặc customer'
        });
      }

      // Lưu tin nhắn vào database
      const newMessage = await Chat.sendMessage(chatId, message.trim(), sender);
      
      // Gửi tin nhắn realtime qua Socket.IO
      try {
        const io = getIO();
        
        if (sender === 'admin') {
          // Admin gửi tin nhắn cho customer
          io.to(`customer-${chatId}`).emit('receive-message', {
            id: newMessage.id,
            sender: 'admin',
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            customerId: chatId
          });
          
          // Thông báo cho tất cả admin khác
          io.to('admin-room').emit('new-admin-message', {
            chatId,
            message: newMessage
          });
        } else {
          // Customer gửi tin nhắn cho admin
          io.to('admin-room').emit('receive-customer-message', {
            chatId,
            message: newMessage,
            customerId: chatId
          });
        }
      } catch (socketError) {
        console.error('Socket.IO error:', socketError);
        // Không throw error vì tin nhắn đã được lưu thành công
      }
      
      res.status(201).json({
        success: true,
        message: 'Gửi tin nhắn thành công',
        data: newMessage
      });
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi gửi tin nhắn',
        error: error.message
      });
    }
  }

  // Đánh dấu đã đọc
  static async markAsRead(req, res) {
    try {
      const { chatId } = req.params;
      const adminId = req.user?.id || 1; // Giả sử có middleware auth

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: 'Chat ID là bắt buộc'
        });
      }

      const result = await Chat.markAsRead(chatId, adminId);
      
      // Thông báo đã đọc qua Socket.IO
      try {
        const io = getIO();
        io.to('admin-room').emit('chat-read', {
          chatId,
          adminId,
          timestamp: new Date().toISOString()
        });
      } catch (socketError) {
        console.error('Socket.IO error:', socketError);
      }
      
      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đã đọc',
        data: result
      });
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đánh dấu đã đọc',
        error: error.message
      });
    }
  }

  // Lấy thông tin chi tiết cuộc trò chuyện
  static async getChatInfo(req, res) {
    try {
      const { chatId } = req.params;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: 'Chat ID là bắt buộc'
        });
      }

      const chatInfo = await Chat.getChatInfo(chatId);
      
      res.status(200).json({
        success: true,
        data: chatInfo
      });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chat:', error);
      
      if (error.message === 'Không tìm thấy khách hàng') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin chat',
        error: error.message
      });
    }
  }

  // Tìm kiếm cuộc trò chuyện
  static async searchChats(req, res) {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm || !searchTerm.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Từ khóa tìm kiếm là bắt buộc'
        });
      }

      const chats = await Chat.searchChats(searchTerm.trim());
      
      res.status(200).json({
        success: true,
        data: chats,
        message: `Tìm thấy ${chats.length} kết quả`
      });
    } catch (error) {
      console.error('Lỗi khi tìm kiếm chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tìm kiếm',
        error: error.message
      });
    }
  }

  // Lấy thống kê chat
  static async getChatStats(req, res) {
    try {
      const stats = await Chat.getChatStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê',
        error: error.message
      });
    }
  }

  // Xóa tin nhắn (soft delete hoặc hard delete)
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID là bắt buộc'
        });
      }

      // Thực hiện xóa tin nhắn (cần implement trong model)
      const result = await Chat.deleteMessage(messageId);
      
      // Thông báo xóa tin nhắn qua Socket.IO
      try {
        const io = getIO();
        io.to('admin-room').emit('message-deleted', {
          messageId,
          timestamp: new Date().toISOString()
        });
      } catch (socketError) {
        console.error('Socket.IO error:', socketError);
      }
      
      res.status(200).json({
        success: true,
        message: 'Xóa tin nhắn thành công',
        data: result
      });
    } catch (error) {
      console.error('Lỗi khi xóa tin nhắn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa tin nhắn',
        error: error.message
      });
    }
  }

  // Gửi tin nhắn tự động/template
  static async sendAutoMessage(req, res) {
    try {
      const { chatId, templateType } = req.body;

      const templates = {
        welcome: 'Chào bạn! Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ hỗ trợ bạn ngay.',
        closing: 'Cảm ơn bạn đã liên hệ. Chúc bạn một ngày tốt lành!',
        offline: 'Hiện tại chúng tôi đang offline. Vui lòng để lại tin nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.',
        support_hours: 'Giờ hỗ trợ của chúng tôi: 8:00 - 22:00 từ Thứ 2 đến Chủ nhật.'
      };

      const message = templates[templateType];
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Template không hợp lệ'
        });
      }

      const newMessage = await Chat.sendMessage(chatId, message, 'admin');
      
      // Gửi tin nhắn template qua Socket.IO
      try {
        const io = getIO();
        io.to(`customer-${chatId}`).emit('receive-message', {
          id: newMessage.id,
          sender: 'admin',
          content: newMessage.content,
          createdAt: newMessage.createdAt,
          isTemplate: true,
          templateType
        });
      } catch (socketError) {
        console.error('Socket.IO error:', socketError);
      }
      
      res.status(201).json({
        success: true,
        message: 'Gửi tin nhắn template thành công',
        data: newMessage
      });
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn tự động:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi gửi tin nhắn tự động',
        error: error.message
      });
    }
  }

  // Export chat history
  static async exportChatHistory(req, res) {
    try {
      const { chatId, format = 'json' } = req.query;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: 'Chat ID là bắt buộc'
        });
      }

      const messages = await Chat.getMessagesByUserId(chatId);
      const chatInfo = await Chat.getChatInfo(chatId);

      const exportData = {
        chatInfo,
        messages,
        exportDate: new Date().toISOString(),
        totalMessages: messages.length
      };

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}-${Date.now()}.json"`);
        res.json(exportData);
      } else {
        // Có thể implement export CSV hoặc PDF ở đây
        res.status(400).json({
          success: false,
          message: 'Format không được hỗ trợ. Chỉ hỗ trợ json.'
        });
      }
    } catch (error) {
      console.error('Lỗi khi export chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi export chat',
        error: error.message
      });
    }
  }

  // Lấy trạng thái online của khách hàng
  static async getOnlineUsers(req, res) {
    try {
      const io = getIO();
      const onlineUsers = [];
      
      // Lấy danh sách socket rooms
      const rooms = io.sockets.adapter.rooms;
      
      for (const [roomId, room] of rooms) {
        if (roomId.startsWith('customer-')) {
          const customerId = roomId.replace('customer-', '');
          onlineUsers.push(customerId);
        }
      }
      
      res.status(200).json({
        success: true,
        data: onlineUsers
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách online users:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách online users',
        error: error.message
      });
    }
  }
}

module.exports = ChatController;