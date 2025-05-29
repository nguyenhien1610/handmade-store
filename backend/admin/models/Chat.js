// \handmade-store\backend\admin\models\Chat.js
const db = require('../../config/database');

class Chat {
  // Khởi tạo các prepared statements để tối ưu performance
  static initStatements() {
    this.statements = {
      getAllChats: db.prepare(`
        WITH chat_summary AS (
          SELECT 
            c.id_user,
            c.noi_dung as last_message,
            c.thoi_gian_gui as last_message_time,
            ROW_NUMBER() OVER (PARTITION BY c.id_user ORDER BY c.thoi_gian_gui DESC) as rn
          FROM chatbox c
        ),
        unread_counts AS (
          SELECT 
            c.id_user,
            COUNT(*) as unread_count
          FROM chatbox c
          LEFT JOIN (
            SELECT id_user, MAX(thoi_gian_gui) as last_admin_time
            FROM chatbox 
            WHERE nguoi_gui = 'admin'
            GROUP BY id_user
          ) admin_msgs ON c.id_user = admin_msgs.id_user
          WHERE c.nguoi_gui = 'customer' 
            AND (admin_msgs.last_admin_time IS NULL OR c.thoi_gian_gui > admin_msgs.last_admin_time)
          GROUP BY c.id_user
        )
        SELECT 
          u.id_user as id,
          u.hoten as customerName,
          u.email,
          u.sdt as phone,
          cs.last_message as lastMessage,
          cs.last_message_time as lastMessageTime,
          COALESCE(uc.unread_count, 0) as unreadCount,
          1 as isOnline
        FROM Users u
        LEFT JOIN chat_summary cs ON u.id_user = cs.id_user AND cs.rn = 1
        LEFT JOIN unread_counts uc ON u.id_user = uc.id_user
        WHERE u.vaitro = 'customer' 
          AND EXISTS (SELECT 1 FROM chatbox WHERE id_user = u.id_user)
        ORDER BY cs.last_message_time DESC NULLS LAST
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

      getChatInfo: db.prepare(`
        SELECT 
          u.id_user as id,
          u.hoten as customerName,
          u.email,
          u.sdt as phone,
          u.diachi as address,
          u.ngaytao as joinDate,
          (SELECT COUNT(*) FROM chatbox WHERE id_user = u.id_user AND nguoi_gui = 'customer') as totalMessages,
          (SELECT thoi_gian_gui FROM chatbox WHERE id_user = u.id_user ORDER BY thoi_gian_gui DESC LIMIT 1) as lastActivity
        FROM Users u
        WHERE u.id_user = ? AND u.vaitro = 'customer'
      `),

      searchChats: db.prepare(`
        WITH chat_summary AS (
          SELECT 
            c.id_user,
            c.noi_dung as last_message,
            c.thoi_gian_gui as last_message_time,
            ROW_NUMBER() OVER (PARTITION BY c.id_user ORDER BY c.thoi_gian_gui DESC) as rn
          FROM chatbox c
        ),
        unread_counts AS (
          SELECT 
            c.id_user,
            COUNT(*) as unread_count
          FROM chatbox c
          LEFT JOIN (
            SELECT id_user, MAX(thoi_gian_gui) as last_admin_time
            FROM chatbox 
            WHERE nguoi_gui = 'admin'
            GROUP BY id_user
          ) admin_msgs ON c.id_user = admin_msgs.id_user
          WHERE c.nguoi_gui = 'customer' 
            AND (admin_msgs.last_admin_time IS NULL OR c.thoi_gian_gui > admin_msgs.last_admin_time)
          GROUP BY c.id_user
        )
        SELECT 
          u.id_user as id,
          u.hoten as customerName,
          u.email,
          u.sdt as phone,
          cs.last_message as lastMessage,
          cs.last_message_time as lastMessageTime,
          COALESCE(uc.unread_count, 0) as unreadCount,
          1 as isOnline
        FROM Users u
        LEFT JOIN chat_summary cs ON u.id_user = cs.id_user AND cs.rn = 1
        LEFT JOIN unread_counts uc ON u.id_user = uc.id_user
        WHERE u.vaitro = 'customer' 
          AND EXISTS (SELECT 1 FROM chatbox WHERE id_user = u.id_user)
          AND (u.hoten LIKE ? OR u.email LIKE ? OR u.sdt LIKE ?)
        ORDER BY cs.last_message_time DESC NULLS LAST
      `),

      customerExists: db.prepare(`
        SELECT COUNT(*) as count FROM Users WHERE id_user = ? AND vaitro = 'customer'
      `),

      deleteMessage: db.prepare(`
        UPDATE chatbox 
        SET noi_dung = '[Tin nhắn đã bị xóa]', 
            is_deleted = 1 
        WHERE id_chat = ?
      `),

      getUnreadMessages: db.prepare(`
        SELECT 
          id_chat as id,
          nguoi_gui as sender,
          noi_dung as content,
          thoi_gian_gui as createdAt
        FROM chatbox 
        WHERE id_user = ? 
          AND nguoi_gui = 'customer'
          AND thoi_gian_gui > COALESCE((
            SELECT MAX(thoi_gian_gui) FROM chatbox 
            WHERE id_user = ? AND nguoi_gui = 'admin'
          ), '1970-01-01')
        ORDER BY thoi_gian_gui ASC
      `),

      markAsRead: db.prepare(`
        INSERT OR REPLACE INTO chat_read_status (user_id, admin_id, last_read_message_id, read_at)
        VALUES (?, ?, (SELECT MAX(id_chat) FROM chatbox WHERE id_user = ?), datetime('now', 'localtime'))
      `)
    };
  }

  // Đảm bảo bảng chat_read_status tồn tại
  static ensureChatReadStatusTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chat_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        last_read_message_id INTEGER,
        read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, admin_id)
      )
    `;
    
    try {
      db.exec(createTableQuery);
    } catch (error) {
      console.error('Error creating chat_read_status table:', error);
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

  // Lấy danh sách tất cả các cuộc trò chuyện với thông tin khách hàng
  static async getAllChats() {
    try {
      if (!this.statements) this.initStatements();
      
      const rows = this.statements.getAllChats.all();
      
      return rows.map(row => ({
        id: row.id,
        customerName: row.customerName || 'Khách hàng',
        email: row.email,
        phone: row.phone,
        lastMessage: row.lastMessage,
        lastMessageTime: row.lastMessageTime,
        unreadCount: row.unreadCount || 0,
        isOnline: Boolean(row.isOnline)
      }));
    } catch (error) {
      console.error('Error in getAllChats:', error);
      throw error;
    }
  }

  // Lấy tất cả tin nhắn của một cuộc trò chuyện
  static async getMessagesByUserId(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const rows = this.statements.getMessagesByUserId.all(userId);
      
      return rows.filter(row => !row.isDeleted).map(row => ({
        id: row.id,
        sender: row.sender,
        content: row.content,
        createdAt: row.createdAt
      }));
    } catch (error) {
      console.error('Error in getMessagesByUserId:', error);
      throw error;
    }
  }

  // Gửi tin nhắn mới
  static async sendMessage(userId, message, sender = 'admin') {
    try {
      if (!this.statements) this.initStatements();
      
      const result = this.statements.insertMessage.run(userId, sender, message);
      const lastMessage = this.statements.getLastMessage.get(result.lastInsertRowid);
      
      return lastMessage;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  // Đánh dấu đã đọc tin nhắn
  static async markAsRead(userId, adminId) {
    try {
      this.ensureChatReadStatusTable();
      if (!this.statements) this.initStatements();
      
      this.statements.markAsRead.run(adminId, userId, userId);
      
      return {
        success: true,
        message: 'Đã đánh dấu đã đọc',
        userId,
        adminId,
        readAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  // Lấy thông tin chi tiết một cuộc trò chuyện
  static async getChatInfo(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const row = this.statements.getChatInfo.get(userId);
      
      if (!row) {
        throw new Error('Không tìm thấy khách hàng');
      }
      
      return row;
    } catch (error) {
      console.error('Error in getChatInfo:', error);
      throw error;
    }
  }

  // Tìm kiếm cuộc trò chuyện theo tên khách hàng
  static async searchChats(searchTerm) {
    try {
      if (!this.statements) this.initStatements();
      
      const searchPattern = `%${searchTerm}%`;
      const rows = this.statements.searchChats.all(searchPattern, searchPattern, searchPattern);
      
      return rows.map(row => ({
        id: row.id,
        customerName: row.customerName || 'Khách hàng',
        email: row.email,
        phone: row.phone,
        lastMessage: row.lastMessage,
        lastMessageTime: row.lastMessageTime,
        unreadCount: row.unreadCount || 0,
        isOnline: Boolean(row.isOnline)
      }));
    } catch (error) {
      console.error('Error in searchChats:', error);
      throw error;
    }
  }

  // Lấy thống kê chat
  static async getChatStats() {
    try {
      const queries = {
        totalChats: db.prepare(`
          SELECT COUNT(DISTINCT id_user) as count 
          FROM chatbox 
          WHERE id_user IN (SELECT id_user FROM Users WHERE vaitro = 'customer')
        `),
        totalMessages: db.prepare(`SELECT COUNT(*) as count FROM chatbox`),
        unreadMessages: db.prepare(`
          SELECT COUNT(*) as count FROM chatbox c
          WHERE c.nguoi_gui = 'customer' 
            AND c.thoi_gian_gui > COALESCE((
              SELECT MAX(thoi_gian_gui) FROM chatbox 
              WHERE id_user = c.id_user AND nguoi_gui = 'admin'
            ), '1970-01-01')
        `),
        todayMessages: db.prepare(`
          SELECT COUNT(*) as count FROM chatbox 
          WHERE DATE(thoi_gian_gui) = DATE('now', 'localtime')
        `),
        activeChatsToday: db.prepare(`
          SELECT COUNT(DISTINCT id_user) as count FROM chatbox 
          WHERE DATE(thoi_gian_gui) = DATE('now', 'localtime')
        `)
      };

      const stats = {};
      for (const [key, statement] of Object.entries(queries)) {
        const row = statement.get();
        stats[key] = row?.count || 0;
      }

      return stats;
    } catch (error) {
      console.error('Error in getChatStats:', error);
      throw error;
    }
  }

  // Xóa tin nhắn
  static async deleteMessage(messageId) {
    try {
      this.ensureIsDeletedColumn();
      if (!this.statements) this.initStatements();
      
      const result = this.statements.deleteMessage.run(messageId);
      
      if (result.changes === 0) {
        throw new Error('Không tìm thấy tin nhắn để xóa');
      }
      
      return {
        success: true,
        message: 'Xóa tin nhắn thành công',
        messageId,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      throw error;
    }
  }

  // Lấy tin nhắn chưa đọc
  static async getUnreadMessages(userId) {
    try {
      if (!this.statements) this.initStatements();
      
      const rows = this.statements.getUnreadMessages.all(userId, userId);
      return rows;
    } catch (error) {
      console.error('Error in getUnreadMessages:', error);
      throw error;
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

  // Tạo hoặc lấy cuộc trò chuyện
  static async getOrCreateChat(userId) {
    try {
      const customerExists = await this.customerExists(userId);
      if (!customerExists) {
        throw new Error('Khách hàng không tồn tại');
      }

      const existingMessages = await this.getMessagesByUserId(userId);
      
      if (existingMessages.length === 0) {
        const welcomeMessage = 'Chào bạn! Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ hỗ trợ bạn ngay.';
        await this.sendMessage(userId, welcomeMessage, 'admin');
      }

      return this.getChatInfo(userId);
    } catch (error) {
      console.error('Error in getOrCreateChat:', error);
      throw error;
    }
  }

  // Hàm helper để thực hiện transaction
  static transaction(fn) {
    const transaction = db.transaction(fn);
    return transaction;
  }

  // Lấy thống kê chat theo khoảng thời gian
  static async getChatStatsByDateRange(startDate, endDate) {
    try {
      const query = db.prepare(`
        SELECT 
          DATE(thoi_gian_gui) as date,
          COUNT(*) as message_count,
          COUNT(DISTINCT id_user) as active_users,
          COUNT(CASE WHEN nguoi_gui = 'customer' THEN 1 END) as customer_messages,
          COUNT(CASE WHEN nguoi_gui = 'admin' THEN 1 END) as admin_messages
        FROM chatbox
        WHERE DATE(thoi_gian_gui) BETWEEN ? AND ?
        GROUP BY DATE(thoi_gian_gui)
        ORDER BY date DESC
      `);

      return query.all(startDate, endDate);
    } catch (error) {
      console.error('Error in getChatStatsByDateRange:', error);
      throw error;
    }
  }

  // Cleanup old messages (helper method)
  static async cleanupOldMessages(daysToKeep = 90) {
    try {
      const query = db.prepare(`
        DELETE FROM chatbox 
        WHERE DATE(thoi_gian_gui) < DATE('now', '-' || ? || ' days')
          AND is_deleted = 1
      `);

      const result = query.run(daysToKeep);
      return {
        success: true,
        deletedCount: result.changes,
        message: `Đã xóa ${result.changes} tin nhắn cũ`
      };
    } catch (error) {
      console.error('Error in cleanupOldMessages:', error);
      throw error;
    }
  }
}

// Khởi tạo các statements khi load module
Chat.initStatements();
Chat.ensureChatReadStatusTable();
Chat.ensureIsDeletedColumn();

module.exports = Chat;