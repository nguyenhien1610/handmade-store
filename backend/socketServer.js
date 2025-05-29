// handmade-store\backend\socketServer.js (Enhanced version)
const { Server } = require('socket.io');
const {
  authenticateSocket,
  requireAdmin,
  requireCustomer,
  joinRoleBasedRoom,
  broadcastUserStatus,
  validateMessageData,
  createRateLimiter
} = require('./utils/socketAuth');
const ClientChat = require('./client/models/ClientChat');


let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:5000", 
        process.env.CLIENT_URL || "http://localhost:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["authorization"]  
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Rate limiter
  const messageRateLimit = createRateLimiter(20, 60000); // 20 messages per minute

  // Socket authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id} (User: ${socket.user?.hoten})`);

    // Join appropriate rooms based on user role
    joinRoleBasedRoom(socket);

    // Broadcast user online status
    broadcastUserStatus(socket, true);

    // Customer Events
    if (socket.user?.vaitro === 'customer') {
      setupCustomerEvents(socket);
    }

    // Admin Events
    if (socket.user?.vaitro === 'admin') {
      setupAdminEvents(socket);
    }

    // Common Events
    setupCommonEvents(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
      broadcastUserStatus(socket, false);
    });
  });

  console.log('🚀 Socket.IO server initialized');
  return io;
};

// Setup customer-specific events
const setupCustomerEvents = (socket) => {
  const customerId = socket.user.id_user;

  // Send message event with rate limiting
  socket.use(messageRateLimit);
  
  socket.on('send-message', async (data, callback) => {
    try {
      // Validate message data
      const validation = validateMessageData(data);
      if (!validation.isValid) {
        return callback?.({
          success: false,
          error: validation.errors.join(', ')
        });
      }

      // Save message to database
      const newMessage = await ClientChat.sendMessage(
        customerId,
        data.message.trim(),
        'customer'
      );

      // Emit to admin room
      socket.to('admin-room').emit('receive-customer-message', {
        chatId: customerId,
        message: newMessage,
        customerInfo: {
          id: customerId,
          name: socket.user.hoten,
          email: socket.user.email
        }
      });

      // Confirm message sent to customer
      socket.emit('message-confirmed', {
        tempId: data.tempId,
        message: newMessage
      });

      callback?.({ success: true, message: newMessage });

    } catch (error) {
      console.error('Error sending customer message:', error);
      callback?.({
        success: false,
        error: 'Failed to send message'
      });
    }
  });

  // Typing indicator
  socket.on('typing-start', () => {
    socket.to('admin-room').emit('customer-typing', {
      chatId: customerId,
      customerName: socket.user.hoten,
      isTyping: true
    });
  });

  socket.on('typing-stop', () => {
    socket.to('admin-room').emit('customer-typing', {
      chatId: customerId,
      customerName: socket.user.hoten,
      isTyping: false
    });
  });

  // Mark messages as read
  socket.on('mark-messages-read', async (callback) => {
    try {
      await ClientChat.markCustomerRead(customerId);
      
      socket.to('admin-room').emit('customer-read-messages', {
        chatId: customerId,
        readAt: new Date().toISOString()
      });

      callback?.({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      callback?.({ success: false, error: 'Failed to mark as read' });
    }
  });

  // Join chat room
  socket.on('join-chat', async (callback) => {
    try {
      const messages = await ClientChat.getMessagesByUserId(customerId);
      const unreadCount = await ClientChat.getUnreadMessagesCount(customerId);

      callback?.({
        success: true,
        data: {
          messages,
          unreadCount,
          chatId: customerId
        }
      });
    } catch (error) {
      console.error('Error joining chat:', error);
      callback?.({ success: false, error: 'Failed to join chat' });
    }
  });
};

// Setup admin-specific events
const setupAdminEvents = (socket) => {
  // Send message to customer
  socket.on('send-admin-message', async (data, callback) => {
    try {
      const { customerId, message } = data;

      // Validate
      if (!customerId || !message?.trim()) {
        return callback?.({
          success: false,
          error: 'Customer ID and message are required'
        });
      }

      // Check if customer exists
      const customerExists = await ClientChat.customerExists(customerId);
      if (!customerExists) {
        return callback?.({
          success: false,
          error: 'Customer not found'
        });
      }

      // Save message
      const newMessage = await ClientChat.sendMessage(
        customerId,
        message.trim(),
        'admin'
      );

      // Send to customer
      socket.to(`customer-${customerId}`).emit('receive-admin-message', {
        message: newMessage,
        adminInfo: {
          name: socket.user.hoten
        }
      });

      // Confirm to admin
      socket.emit('admin-message-confirmed', {
        tempId: data.tempId,
        message: newMessage,
        customerId
      });

      callback?.({ success: true, message: newMessage });

    } catch (error) {
      console.error('Error sending admin message:', error);
      callback?.({
        success: false,
        error: 'Failed to send message'
      });
    }
  });

  // Get chat list
  socket.on('get-chat-list', async (callback) => {
    try {
      // This would require a method to get all active chats
      // You might need to implement this in ClientChat model
      const chatList = []; // Implement this based on your needs
      
      callback?.({
        success: true,
        data: chatList
      });
    } catch (error) {
      console.error('Error getting chat list:', error);
      callback?.({ success: false, error: 'Failed to get chat list' });
    }
  });

  // Admin typing indicator
  socket.on('admin-typing', (data) => {
    const { customerId, isTyping } = data;
    socket.to(`customer-${customerId}`).emit('admin-typing', {
      isTyping,
      adminName: socket.user.hoten
    });
  });
};

// Setup common events
const setupCommonEvents = (socket) => {
  // Ping/Pong for connection health
  socket.on('ping', (callback) => {
    callback?.('pong');
  });

  // Get online status
  socket.on('get-online-status', (callback) => {
    const adminRoom = io.sockets.adapter.rooms.get('admin-room');
    const isAdminOnline = adminRoom && adminRoom.size > 0;

    callback?.({
      isAdminOnline,
      timestamp: new Date().toISOString()
    });
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.user?.hoten}:`, error);
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper functions for external use
const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
};

const emitToCustomer = (customerId, event, data) => {
  if (io) {
    io.to(`customer-${customerId}`).emit(event, data);
  }
};

const getOnlineUsers = () => {
  if (!io) return { admins: 0, customers: 0 };

  const adminRoom = io.sockets.adapter.rooms.get('admin-room');
  const adminCount = adminRoom ? adminRoom.size : 0;

  // Count customers would require iterating through all rooms
  // This is a simplified version
  return {
    admins: adminCount,
    customers: 0 // Implement customer counting if needed
  };
};

module.exports = {
  initializeSocket,
  getIO,
  emitToAdmin,
  emitToCustomer,
  getOnlineUsers
};