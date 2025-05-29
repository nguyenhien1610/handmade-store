// handmade-store\backend\client\controllers\chatController.js
const ClientChat = require('../models/ClientChat');
const { getIO } = require('../../socketServer');

class ClientChatController {
  // Khách hàng gửi tin nhắn
  static async sendMessage(req, res) {
    try {
      const { message } = req.body;
      const customerId = req.user?.id_user || req.body.customerId;

      // Validation
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

      // Kiểm tra khách hàng có tồn tại không
      const customerExists = await ClientChat.customerExists(customerId);
      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: 'Tài khoản không tồn tại'
        });
      }

      // Lưu tin nhắn vào database
      const newMessage = await ClientChat.sendMessage(customerId, message.trim(), 'customer');
      
      // Gửi tin nhắn realtime qua Socket.IO
      try {
        const io = getIO();
        
        // Gửi tin nhắn cho admin
        io.to('admin-room').emit('receive-customer-message', {
          chatId: customerId,
          message: newMessage,
          customerId: customerId,
          customerInfo: {
            id: customerId,
            name: req.user?.hoten || 'Khách hàng',
            email: req.user?.email
          }
        });

        // Gửi lại cho chính customer để confirm
        io.to(`customer-${customerId}`).emit('message-sent', {
          id: newMessage.id,
          sender: 'customer',
          content: newMessage.content,
          createdAt: newMessage.createdAt,
          status: 'sent'
        });
        
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

  // Lấy lịch sử chat của khách hàng
  static async getChatHistory(req, res) {
    try {
      const customerId = req.user?.id_user || req.query.customerId;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để xem lịch sử chat'
        });
      }

      // Kiểm tra khách hàng có tồn tại không
      const customerExists = await ClientChat.customerExists(customerId);
      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: 'Tài khoản không tồn tại'
        });
      }

      const messages = await ClientChat.getMessagesByUserId(customerId);
      
      res.status(200).json({
        success: true,
        data: messages,
        total: messages.length
      });
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch sử chat',
        error: error.message
      });
    }
  }

  // Bắt đầu cuộc trò chuyện mới (tự động gửi tin nhắn chào)
  static async startChat(req, res) {
    try {
      const customerId = req.user?.id_user || req.body.customerId;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để bắt đầu chat'
        });
      }

      // Kiểm tra khách hàng có tồn tại không
      const customerExists = await ClientChat.customerExists(customerId);
      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: 'Tài khoản không tồn tại'
        });
      }

      // Kiểm tra xem đã có cuộc trò chuyện chưa
      const existingMessages = await ClientChat.getMessagesByUserId(customerId);
      
      let chatInfo = {
        chatId: customerId,
        hasExistingChat: existingMessages.length > 0,
        messages: existingMessages
      };

      // Nếu chưa có tin nhắn nào, tạo tin nhắn chào đầu tiên
      if (existingMessages.length === 0) {
        const welcomeMessage = await ClientChat.sendMessage(
          customerId, 
          'Xin chào! Tôi cần tư vấn về sản phẩm.', 
          'customer'
        );

        // Gửi thông báo cho admin
        try {
          const io = getIO();
          io.to('admin-room').emit('new-chat-started', {
            chatId: customerId,
            message: welcomeMessage,
            customerInfo: {
              id: customerId,
              name: req.user?.hoten || 'Khách hàng',
              email: req.user?.email
            }
          });
        } catch (socketError) {
          console.error('Socket.IO error:', socketError);
        }

        chatInfo.messages = [welcomeMessage];
        chatInfo.isNewChat = true;
      }

      res.status(200).json({
        success: true,
        message: chatInfo.hasExistingChat ? 'Đã tải lịch sử chat' : 'Đã bắt đầu cuộc trò chuyện mới',
        data: chatInfo
      });
    } catch (error) {
      console.error('Lỗi khi bắt đầu chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi bắt đầu chat',
        error: error.message
      });
    }
  }

  // Lấy thông tin trạng thái chat (admin online/offline)
  static async getChatStatus(req, res) {
    try {
      const io = getIO();
      const adminRoomSockets = io.sockets.adapter.rooms.get('admin-room');
      const isAdminOnline = adminRoomSockets && adminRoomSockets.size > 0;

      // Lấy thông tin cửa hàng
      const storeInfo = await ClientChat.getStoreInfo();
      
      res.status(200).json({
        success: true,
        data: {
          isAdminOnline,
          adminResponseTime: isAdminOnline ? 'Trả lời ngay' : 'Trong vòng 24h',
          storeInfo: {
            name: storeInfo.ten_cua_hang,
            supportHours: storeInfo.gio_mo_cua,
            phone: storeInfo.sdt,
            email: storeInfo.email
          }
        }
      });
    } catch (error) {
      console.error('Lỗi khi lấy trạng thái chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy trạng thái chat',
        error: error.message
      });
    }
  }

  // Đánh dấu tin nhắn đã được khách hàng đọc
  static async markMessagesAsRead(req, res) {
    try {
      const customerId = req.user?.id_user || req.body.customerId;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập'
        });
      }

      const result = await ClientChat.markCustomerRead(customerId);
      
      // Thông báo cho admin
      try {
        const io = getIO();
        io.to('admin-room').emit('customer-read-messages', {
          chatId: customerId,
          readAt: new Date().toISOString()
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
        message: 'Lỗi server',
        error: error.message
      });
    }
  }

  // Lấy số lượng tin nhắn chưa đọc từ admin
  static async getUnreadCount(req, res) {
    try {
      const customerId = req.user?.id_user || req.query.customerId;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập'
        });
      }

      const unreadCount = await ClientChat.getUnreadMessagesCount(customerId);
      
      res.status(200).json({
        success: true,
        data: {
          unreadCount,
          hasUnread: unreadCount > 0
        }
      });
    } catch (error) {
      console.error('Lỗi khi lấy số tin nhắn chưa đọc:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  }

  // Gửi thông tin đang typing
  static async sendTyping(req, res) {
    try {
      const customerId = req.user?.id_user || req.body.customerId;
      const { isTyping } = req.body;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập'
        });
      }

      // Gửi thông báo typing cho admin
      try {
        const io = getIO();
        io.to('admin-room').emit('customer-typing', {
          chatId: customerId,
          customerName: req.user?.hoten || 'Khách hàng',
          isTyping: Boolean(isTyping)
        });
      } catch (socketError) {
        console.error('Socket.IO error:', socketError);
      }

      res.status(200).json({
        success: true,
        message: 'Đã gửi trạng thái typing'
      });
    } catch (error) {
      console.error('Lỗi khi gửi typing status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  }

  // Lấy template câu hỏi thường gặp
  static async getQuickQuestions(req, res) {
    try {
      const quickQuestions = [
        {
          id: 1,
          question: 'Tôi muốn hỏi về sản phẩm',
          message: 'Xin chào! Tôi muốn hỏi về sản phẩm của cửa hàng.'
        },
        {
          id: 2,
          question: 'Làm thế nào để đặt hàng?',
          message: 'Tôi muốn biết cách đặt hàng như thế nào ạ?'
        },
        {
          id: 3,
          question: 'Chính sách đổi trả',
          message: 'Cho tôi hỏi về chính sách đổi trả sản phẩm.'
        },
        {
          id: 4,
          question: 'Thời gian giao hàng',
          message: 'Thời gian giao hàng mất bao lâu ạ?'
        },
        {
          id: 5,
          question: 'Phương thức thanh toán',
          message: 'Cửa hàng hỗ trợ những phương thức thanh toán nào?'
        },
        {
          id: 6,
          question: 'Tư vấn sản phẩm',
          message: 'Tôi cần tư vấn để chọn sản phẩm phù hợp.'
        }
      ];

      res.status(200).json({
        success: true,
        data: quickQuestions
      });
    } catch (error) {
      console.error('Lỗi khi lấy câu hỏi nhanh:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  }
}

module.exports = ClientChatController;