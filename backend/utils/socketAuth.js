// handmade-store\backend\utils\socketAuth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Xác thực socket connection
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ Socket connection denied: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('❌ Socket connection denied: Invalid token');
        return next(new Error('Authentication error: Invalid token'));
      }

      // Kiểm tra user trong database
      try {
        const user = db.prepare('SELECT id_user, hoten, email, vaitro, trang_thai FROM Users WHERE id_user = ?').get(decoded.id_user);
        
        if (!user) {
          console.log('❌ Socket connection denied: User not found');
          return next(new Error('Authentication error: User not found'));
        }

        if (user.trang_thai !== 'hoat_dong') {
          console.log('❌ Socket connection denied: User account inactive');
          return next(new Error('Authentication error: Account inactive'));
        }

        socket.user = user;
        console.log(`✅ Socket authenticated for user: ${user.hoten} (ID: ${user.id_user})`);
        next();
      } catch (dbError) {
        console.error('❌ Database error during socket auth:', dbError);
        next(new Error('Authentication error: Database error'));
      }
    });
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

// Kiểm tra quyền admin
const requireAdmin = (socket, next) => {
  if (!socket.user || socket.user.vaitro !== 'admin') {
    return next(new Error('Authorization error: Admin access required'));
  }
  next();
};

// Kiểm tra quyền customer
const requireCustomer = (socket, next) => {
  if (!socket.user || socket.user.vaitro !== 'customer') {
    return next(new Error('Authorization error: Customer access required'));
  }
  next();
};

// Helper function để join room dựa trên role
const joinRoleBasedRoom = (socket) => {
  if (!socket.user) return;

  const { id_user, vaitro } = socket.user;
  
  if (vaitro === 'admin') {
    socket.join('admin-room');
    console.log(`👤 Admin ${socket.user.hoten} joined admin-room`);
  } else if (vaitro === 'customer') {
    socket.join(`customer-${id_user}`);
    console.log(`👤 Customer ${socket.user.hoten} joined customer-${id_user} room`);
  }
};

// Helper function để broadcast user status
const broadcastUserStatus = (socket, isOnline = true) => {
  if (!socket.user) return;

  const { id_user, vaitro, hoten } = socket.user;
  
  if (vaitro === 'admin') {
    // Thông báo admin online/offline cho tất cả customer
    socket.broadcast.emit('admin-status-changed', {
      adminId: id_user,
      adminName: hoten,
      isOnline
    });
  } else if (vaitro === 'customer') {
    // Thông báo customer online/offline cho admin
    socket.to('admin-room').emit('customer-status-changed', {
      customerId: id_user,
      customerName: hoten,
      isOnline
    });
  }
};

// Validate message data
const validateMessageData = (data) => {
  const errors = [];
  
  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    errors.push('Message content is required and must be a non-empty string');
  }
  
  if (data.message && data.message.length > 1000) {
    errors.push('Message content too long (max 1000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting helper
const createRateLimiter = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();
  
  return (socket, next) => {
    const userId = socket.user?.id_user;
    if (!userId) return next();
    
    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return next(new Error('Rate limit exceeded'));
    }
    
    validRequests.push(now);
    requests.set(userId, validRequests);
    
    next();
  };
};

module.exports = {
  authenticateSocket,
  requireAdmin,
  requireCustomer,
  joinRoleBasedRoom,
  broadcastUserStatus,
  validateMessageData,
  createRateLimiter
};