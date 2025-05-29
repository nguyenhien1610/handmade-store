// handmade-store\backend\client\models\ClientChat.js
const db = require('../../config/database');

class ClientChat {
  // Khởi tạo các prepared statements
  static initStatements() {
    this.statements = {
      customerExists: db.prepare(`
        SELECT COUNT(*) as count FROM Users WHERE id_user = ? AND vaitro = 'customer'
      `),

      getMessagesByUserId: db.prepare(`
        SELECT 
          id_chat as id,
          nguoi_gui as sender,
          noi_dung as content,
          thoi_gian_gui as createdAt,
          COALESCE(is_deleted, 0) as isDeleted
        FROM chatbox 
        WHERE id_user = ?
        ORDER BY thoi_gian_gui ASC, id_chat ASC
      `),

      insertMessage: db.prepare(`
        INSERT INTO chatbox (id_user, nguoi_gui, noi_dung, thoi_gian_gui)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
      `),

      getLastMessage: db.prepare(`
        SELECT 
          id_chat as id,
          nguoi_gui as sender,
          noi_dung as content,
          thoi_gian_gui as createdAt
        FROM chatbox 
        WHERE id_chat = ?
      `),

      getStoreInfo: db.prepare(`
        SELECT 
          ten_cua_hang,
          dia_chi,
          sdt,
          email,
          gio_mo_cua,
          mo_ta
        FROM cua_hang_info 
        WHERE id = 1
      `),

      getUnreadMessagesCount: db.prepare(`
        SELECT COUNT(*) as count
        FROM chatbox 
        WHERE id_user = ? 
          AND nguoi_gui = 'admin'
          AND thoi_gian_gui > COALESCE((
            SELECT last_customer_read_time 
            FROM customer_read_status 
            WHERE user_id = ?
          ), '1970-01-01')
      `),

      updateCustomerReadTime: db.prepare(`
        INSERT OR REPLACE INTO customer_read_status (user_id, last_customer_read_time)
        VALUES (?, datetime('now', 'localtime'))
      `),

      getCustomerInfo: db.prepare(`
        SELECT 
          id_user as id,
          hoten as name,
          email,
          sdt as phone,
          diachi as address,
          ngaytao as joinDate
        FROM Users
        WHERE id_user = ? AND vaitro = 'customer'
      `),

      getChatSummary: db.prepare(`
        SELECT 
          COUNT(*) as totalMessages,
          COUNT(CASE WHEN nguoi_gui = 'customer' THEN 1 END) as customerMessages,
          COUNT(CASE WHEN nguoi_gui = 'admin' THEN 1 END) as adminMessages,
          MIN(thoi_gian_gui) as firstMessageTime,
          MAX(thoi_gian_gui) as lastMessageTime
        FROM chatbox
        WHERE id_user = ?
      `),

      getRecentAdminMessage: db.prepare(`
        SELECT 
          id_chat as id,
          noi_dung as content,
          thoi_gian_gui as createdAt
        FROM chatbox 
        WHERE id_user = ? AND nguoi_gui = 'admin'
        ORDER BY thoi_gian_gui DESC 
        LIMIT 1
      `),

      hasActiveChat: db.prepare(`
        SELECT COUNT(*) as count
        FROM chatbox
        WHERE id_user = ?
          AND thoi_gian_gui >= datetime('now', '-7 days')
      `)
    };
  }

  // Đảm bảo bảng customer_read_status tồn tại
  static ensureCustomerReadStatusTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS customer_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        last_customer_read_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id_user)
      )
    `;
    
    try {
      db.exec(createTableQuery);
    } catch (error) {
      console.error('Error creating customer_read_status table:', error);
    }
  }

  // Đảm bảo cột is_deleted tồn tại
  static ensureIsDeletedColumn() {
    try {
      db.exec(`ALTER TABLE chatbox ADD COLUMN is_deleted INTEGER DEFAULT 0`);
    } catch (error) {
      // Cột đã tồn tại, bỏ qua lỗi
    }
  }

  // Kiểm tra khách hàng có tồn tại không
  static async customerExists(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const row = this.statements.customerExists.get(userId);
      return row.count > 0;
    } catch (error) {
      console.error('Error in customerExists:', error);
      throw error;
    }
  }

  // Lấy tất cả tin nhắn của khách hàng
  static async getMessagesByUserId(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const rows = this.statements.getMessagesByUserId.all(userId);
      
      return rows
        .filter(row => !row.isDeleted)
        .map(row => ({
          id: row.id,
          sender: row.sender,
          content: row.content,
          createdAt: row.createdAt,
          isFromAdmin: row.sender === 'admin',
          isFromCustomer: row.sender === 'customer'
        }));
    } catch (error) {
      console.error('Error in getMessagesByUserId:', error);
      throw error;
    }
  }

  // Gửi tin nhắn mới
  static async sendMessage(userId, message, sender = 'customer') {
    try {
      if (!this.statements) this.initStatements();
      
      const result = this.statements.insertMessage.run(userId, sender, message);
      const lastMessage = this.statements.getLastMessage.get(result.lastInsertRowid);
      
      return {
        id: lastMessage.id,
        sender: lastMessage.sender,
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        isFromAdmin: lastMessage.sender === 'admin',
        isFromCustomer: lastMessage.sender === 'customer'
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  // Lấy thông tin cửa hàng
  static async getStoreInfo() {
    try {
      if (!this.statements) this.initStatements();
      
      const row = this.statements.getStoreInfo.get();
      return row || {
        ten_cua_hang: 'Handmade Store',
        dia_chi: 'Chưa cập nhật',
        sdt: 'Chưa cập nhật',
        email: 'info@handmadestore.com',
        gio_mo_cua: '8:00 - 22:00',
        mo_ta: 'Cửa hàng handmade'
      };
    } catch (error) {
      console.error('Error in getStoreInfo:', error);
      throw error;
    }
  }

  // Lấy số lượng tin nhắn chưa đọc từ admin
  static async getUnreadMessagesCount(userId) {
    try {
      this.ensureCustomerReadStatusTable();
      if (!this.statements) this.initStatements();
      
      const row = this.statements.getUnreadMessagesCount.get(userId, userId);
      return row.count || 0;
    } catch (error) {
      console.error('Error in getUnreadMessagesCount:', error);
      throw error;
    }
  }

  // Đánh dấu khách hàng đã đọc tin nhắn
  static async markCustomerRead(userId) {
    try {
      this.ensureCustomerReadStatusTable();
      if (!this.statements) this.initStatements();
      
      this.statements.updateCustomerReadTime.run(userId);
      
      return {
        success: true,
        message: 'Đã đánh dấu đã đọc',
        userId,
        readAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in markCustomerRead:', error);
      throw error;
    }
  }

  // Lấy thông tin khách hàng
  static async getCustomerInfo(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const row = this.statements.getCustomerInfo.get(userId);
      return row;
    } catch (error) {
      console.error('Error in getCustomerInfo:', error);
      throw error;
    }
  }

  // Lấy tóm tắt cuộc trò chuyện
  static async getChatSummary(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const summary = this.statements.getChatSummary.get(userId);
      const recentAdminMessage = this.statements.getRecentAdminMessage.get(userId);
      
      return {
        ...summary,
        hasRecentAdminReply: Boolean(recentAdminMessage),
        lastAdminMessage: recentAdminMessage
      };
    } catch (error) {
      console.error('Error in getChatSummary:', error);
      throw error;
    }
  }

  // Kiểm tra xem có cuộc trò chuyện đang hoạt động không
  static async hasActiveChat(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const row = this.statements.hasActiveChat.get(userId);
      return row.count > 0;
    } catch (error) {
      console.error('Error in hasActiveChat:', error);
      throw error;
    }
  }

  // Lấy tin nhắn gần đây nhất
  static async getLatestMessage(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const query = db.prepare(`
        SELECT 
          id_chat as id,
          nguoi_gui as sender,
          noi_dung as content,
          thoi_gian_gui as createdAt
        FROM chatbox 
        WHERE id_user = ?
        ORDER BY thoi_gian_gui DESC 
        LIMIT 1
      `);
      
      const row = query.get(userId);
      if (!row) return null;
      
      return {
        id: row.id,
        sender: row.sender,
        content: row.content,
        createdAt: row.createdAt,
        isFromAdmin: row.sender === 'admin',
        isFromCustomer: row.sender === 'customer'
      };
    } catch (error) {
      console.error('Error in getLatestMessage:', error);
      throw error;
    }
  }

  // Lấy thống kê chat của khách hàng
  static async getCustomerChatStats(userId) {
    try {
      const summary = await this.getChatSummary(userId);
      const unreadCount = await this.getUnreadMessagesCount(userId);
      const hasActive = await this.hasActiveChat(userId);
      const customerInfo = await this.getCustomerInfo(userId);
      
      return {
        customer: customerInfo,
        totalMessages: summary.totalMessages || 0,
        customerMessages: summary.customerMessages || 0,
        adminMessages: summary.adminMessages || 0,
        unreadCount,
        hasActiveChat: hasActive,
        firstMessageTime: summary.firstMessageTime,
        lastMessageTime: summary.lastMessageTime,
        hasRecentAdminReply: summary.hasRecentAdminReply
      };
    } catch (error) {
      console.error('Error in getCustomerChatStats:', error);
      throw error;
    }
  }

  // Tìm kiếm tin nhắn trong lịch sử
  static async searchMessages(userId, searchTerm) {
    try {
      const query = db.prepare(`
        SELECT 
          id_chat as id,
          nguoi_gui as sender,
          noi_dung as content,
          thoi_gian_gui as createdAt
        FROM chatbox 
        WHERE id_user = ? 
          AND noi_dung LIKE ?
          AND COALESCE(is_deleted, 0) = 0
        ORDER BY thoi_gian_gui DESC
        LIMIT 20
      `);
      
      const searchPattern = `%${searchTerm}%`;
      const rows = query.all(userId, searchPattern);
      
      return rows.map(row => ({
        id: row.id,
        sender: row.sender,
        content: row.content,
        createdAt: row.createdAt,
        isFromAdmin: row.sender === 'admin',
        isFromCustomer: row.sender === 'customer'
      }));
    } catch (error) {
      console.error('Error in searchMessages:', error);
      throw error;
    }
  }

  // Lấy tin nhắn theo khoảng thời gian
  static async getMessagesByDateRange(userId, startDate, endDate) {
    try {
      const query = db.prepare(`
        SELECT 
          id_chat as id,
          nguoi_gui as sender,
          noi_dung as content,
          thoi_gian_gui as createdAt
        FROM chatbox 
        WHERE id_user = ? 
          AND DATE(thoi_gian_gui) BETWEEN ? AND ?
          AND COALESCE(is_deleted, 0) = 0
        ORDER BY thoi_gian_gui ASC
      `);
      
      const rows = query.all(userId, startDate, endDate);
      
      return rows.map(row => ({
        id: row.id,
        sender: row.sender,
        content: row.content,
        createdAt: row.createdAt,
        isFromAdmin: row.sender === 'admin',
        isFromCustomer: row.sender === 'customer'
      }));
    } catch (error) {
      console.error('Error in getMessagesByDateRange:', error);
      throw error;
    }
  }

  // Hàm helper để thực hiện transaction
  static transaction(fn) {
    const transaction = db.transaction(fn);
    return transaction;
  }
}

// Khởi tạo khi load module
ClientChat.initStatements();
ClientChat.ensureCustomerReadStatusTable();
ClientChat.ensureIsDeletedColumn();

module.exports = ClientChat;