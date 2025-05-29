// /home/huyen/handmade-store/frontend/src/api/chatService.js
import axios from './axios';
import authService from './authService';

const chatService = {
  // ============================================================================
  // ADMIN CHAT METHODS
  // ============================================================================

  // Lấy danh sách tất cả cuộc trò chuyện
  getAllChats: async () => {
    try {
      const response = await axios.get('/api/admin/chats');
      return response.data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error.response?.data || error;
    }
  },

  // Lấy tin nhắn của một cuộc trò chuyện
  getMessages: async (chatId) => {
    try {
      const response = await axios.get(`/api/admin/chats/${chatId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error.response?.data || error;
    }
  },

  // Gửi tin nhắn từ admin
  sendMessage: async (chatId, message, sender = 'admin') => {
    try {
      const response = await axios.post('/api/admin/chats/send', {
        chatId,
        message,
        sender
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error.response?.data || error;
    }
  },

  // Đánh dấu đã đọc
  markAsRead: async (chatId) => {
    try {
      const response = await axios.put(`/api/admin/chats/${chatId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error.response?.data || error;
    }
  },

  // Lấy thông tin chi tiết cuộc trò chuyện
  getChatInfo: async (chatId) => {
    try {
      const response = await axios.get(`/api/admin/chats/${chatId}/info`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat info:', error);
      throw error.response?.data || error;
    }
  },

  // Tìm kiếm cuộc trò chuyện
  searchChats: async (searchTerm) => {
    try {
      const response = await axios.get('/api/admin/chats/search', {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching chats:', error);
      throw error.response?.data || error;
    }
  },

  // Lấy thống kê chat
  getChatStats: async () => {
    try {
      const response = await axios.get('/api/admin/chats/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      throw error.response?.data || error;
    }
  },

  // Gửi tin nhắn tự động từ template
  sendAutoMessage: async (chatId, templateType) => {
    try {
      const response = await axios.post('/api/admin/chats/auto-message', {
        chatId,
        templateType
      });
      return response.data;
    } catch (error) {
      console.error('Error sending auto message:', error);
      throw error.response?.data || error;
    }
  },

  // Xóa tin nhắn
  deleteMessage: async (messageId) => {
    try {
      const response = await axios.delete(`/api/admin/chats/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error.response?.data || error;
    }
  },

  // Export lịch sử chat
  exportChatHistory: async (chatId, format = 'json') => {
    try {
      const response = await axios.get(`/api/admin/chats/${chatId}/export`, {
        params: { format },
        responseType: format === 'json' ? 'json' : 'blob'
      });
      
      if (format !== 'json') {
        // Tạo và download file
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `chat-${chatId}-${Date.now()}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error exporting chat:', error);
      throw error.response?.data || error;
    }
  },

  // Lấy danh sách user online
  getOnlineUsers: async () => {
    try {
      const response = await axios.get('/api/admin/chats/online-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error.response?.data || error;
    }
  },

  // ============================================================================
  // CLIENT CHAT METHODS - FIXED VERSION
  // ============================================================================

  // Helper function to ensure authentication
 _ensureAuthenticated: () => {
  const user = authService.getClientUser();
  const token = authService.getToken();
  
  console.log('[chatService] Auth check:', { hasUser: !!user, hasToken: !!token });
  
  if (!user || !token) {
    console.warn('[chatService] Authentication missing - redirecting to login');
    authService.handleAuthError(); // ✅ Redirect về login
    throw new Error('Authentication required');
  }
  
  return { user, token };
},

  // Khách hàng gửi tin nhắn
sendCustomerMessage: async (message, customerId = null) => {
  try {
    const { user, token } = chatService._ensureAuthenticated(); // ✅ Thêm token
    
    if (!user || !token) { // ✅ Kiểm tra cả user và token
      throw new Error('Authentication required');
    }
    
    const response = await axios.post('/api/client/chat/send', {
      message,
      customerId: customerId || user?.id_user || user?.id
    },{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending customer message:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication required');
    }
    
    throw error.response?.data || error;
  }
},

  getCustomerChatHistory: async (customerId = null) => {
  try {
    const { user, token } = chatService._ensureAuthenticated(); // ✅ Thêm token
    
    if (!user || !token) { // ✅ Kiểm tra cả user và token
      throw new Error('Authentication required');
    }
    
    const response = await axios.get('/api/client/chat/history', {
      params: { 
        customerId: customerId || user?.id_user || user?.id 
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching customer chat history:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication required');
    }
    
    throw error.response?.data || error;
  }
},

  // Bắt đầu cuộc trò chuyện mới
  startChat: async (customerId = null) => {
  try {
    const { user, token } = chatService._ensureAuthenticated(); // ✅ Thêm token
    
    if (!user || !token) { // ✅ Kiểm tra cả user và token
      throw new Error('Authentication required');
    }
    
    const response = await axios.post('/api/client/chat/start', {
      customerId: customerId || user?.id_user || user?.id
    },{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error starting chat:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication required');
    }
    
    throw error.response?.data || error;
  }
},


  // Lấy trạng thái chat (admin online/offline)
  getChatStatus: async () => {
  try {
    const { token } = chatService._ensureAuthenticated(); // ✅ Lấy token
    
    const response = await axios.get('/api/client/chat/status', {
      headers: {
        Authorization: `Bearer ${token}` // ✅ Thêm header
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat status:', error);
    throw error.response?.data || error;
  }
},

  // Đánh dấu tin nhắn đã đọc (khách hàng)
  markCustomerMessagesAsRead: async (customerId = null) => {
  try {
    const { user, token } = chatService._ensureAuthenticated(); // ✅ Thêm token
    
    if (!user || !token) { // ✅ Kiểm tra cả user và token
      throw new Error('Authentication required');
    }
    
    const response = await axios.post('/api/client/chat/mark-read', {
      customerId: customerId || user?.id_user || user?.id
    },{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication required');
    }
    
    throw error.response?.data || error;
  }
},
  // Lấy số lượng tin nhắn chưa đọc
  getUnreadCount: async (customerId = null) => {
  try {
    const { user, token } = chatService._ensureAuthenticated(); // ✅ Thêm token
    
    if (!user || !token) { // ✅ Kiểm tra cả user và token
      throw new Error('Authentication required');
    }
    
    const response = await axios.get('/api/client/chat/unread-count', {
      params: { 
        customerId: customerId || user?.id_user || user?.id 
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication required');
    }
    
    throw error.response?.data || error;
  }
},

  // Gửi trạng thái typing
  sendTypingStatus: async (isTyping, customerId = null) => {
  try {
    const { user, token } = chatService._ensureAuthenticated(); // ✅ Thê token
    
    if (!user || !token) { // ✅ Kiểm tra cả user và token
      throw new Error('Authentication required');
    }
    
    const response = await axios.post('/api/client/chat/typing', {
      isTyping,
      customerId: customerId || user?.id_user || user?.id
    },{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending typing status:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication required');
    }
    
    throw error.response?.data || error;
  }
},

  // Lấy câu hỏi nhanh
  getQuickQuestions: async () => {
  try {
    const { token } = chatService._ensureAuthenticated(); // ✅ Lấy token
    
    const response = await axios.get('/api/client/chat/quick-questions', {
      headers: {
        Authorization: `Bearer ${token}` // ✅ Thêm header
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching quick questions:', error);
    throw error.response?.data || error;
  }
},

  // ============================================================================
  // SOCKET.IO INTEGRATION - FIXED VERSION
  // ============================================================================

  // Khởi tạo socket connection
  initSocket: () => {
  if (typeof window !== 'undefined' && window.io) {
    try {
      const { user, token } = chatService._ensureAuthenticated();
      
      // ✅ Check trước khi init socket
      if (!user || !token) {
        console.warn('No token or user found, skipping socket init');
        return null;
      }

      const socket = window.io('http://localhost:5000', {
        auth: { token },
        autoConnect: true,
        timeout: 5000 // ✅ Thêm timeout
      });

      // ... rest of socket setup
      
      return socket;
    } catch (error) {
      console.error('Socket init failed:', error);
      return null; // ✅ Trả về null thay vì throw
    }
  }
  return null;
},


  // Tham gia room chat
  joinChatRoom: (socket, customerId) => {
    if (socket && customerId) {
      socket.emit('join-customer-room', customerId);
    }
  },

  // Rời khỏi room chat
  leaveChatRoom: (socket, customerId) => {
    if (socket && customerId) {
      socket.emit('leave-customer-room', customerId);
    }
  },

  // Gửi typing status qua socket - FIXED
  emitTyping: (socket, senderType, isTyping) => {
    if (socket) {
      try {
        const { user } = chatService._ensureAuthenticated();
        
        if (senderType === 'customer') {
          socket.emit('customer-typing', {
            customerId: user.id_user || user.id,
            isTyping
          });
        }
      } catch (error) {
        console.error('Error emitting typing status:', error);
      }
    }
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  formatMessageTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString("vi-VN", { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays <= 7) {
      return diffDays === 2 ? "Hôm qua" : `${diffDays - 1} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN", { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  },

  getAvatarInitials: (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  validateMessage: (message) => {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Tin nhắn không hợp lệ' };
    }
    
    const trimmed = message.trim();
    if (!trimmed) {
      return { valid: false, error: 'Tin nhắn không được để trống' };
    }
    
    if (trimmed.length > 1000) {
      return { valid: false, error: 'Tin nhắn quá dài (tối đa 1000 ký tự)' };
    }
    
    return { valid: true, message: trimmed };
  },

  checkConnection: async () => {
    try {
      const response = await axios.get('/api/client/chat/status');
      return { connected: true, data: response.data };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  },

  // Format tin nhắn để hiển thị
  formatMessage: (message) => {
    return {
      id: message.id,
      content: message.content,
      sender: message.sender,
      createdAt: message.createdAt,
      time: chatService.formatMessageTime(message.createdAt),
      isFromAdmin: message.sender === 'admin',
      isFromCustomer: message.sender === 'customer'
    };
  },

  // Tạo notification cho tin nhắn mới
  createNotification: (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Tin nhắn mới từ cửa hàng', {
        body: message.content,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
};

export default chatService;