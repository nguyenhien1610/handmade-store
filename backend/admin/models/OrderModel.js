const db = require('../../config/database');

class OrderModel {
  // Lấy tất cả đơn hàng với bộ lọc và phân trang
  static getAllOrders(filters = {}, callback) {
    const { orderCode, status, fromDate, toDate, page = 1, limit = 20 } = filters;
    
    let query = `
      SELECT 
        dh.id_dh,
        dh.id_user,
        u.hoten as ten_khach_hang,
        u.email as email_khach_hang,
        dh.ngaydat,
        dh.tongtien,
        dh.diachigiaohang,
        dh.sdtnhan,
        dh.trangthai,
        dh.note,
        dh.ngaytao,
        dh.hinh_thuc_thanh_toan,
        dh.trang_thai_thanh_toan,
        dh.ma_xac_nhan,
        dh.ngay_nhan_du_kien,
        dh.id_ma_giam_gia,
        dh.gia_tri_giam_gia,
        dh.tong_tien_truoc_giam,
        mg.ma_code as ma_giam_gia_code
      FROM don_hang dh
      LEFT JOIN Users u ON dh.id_user = u.id_user
      LEFT JOIN ma_giam_gia mg ON dh.id_ma_giam_gia = mg.id_ma
      WHERE 1=1
    `;
    
    const params = [];
    
    if (orderCode) {
      query += ` AND dh.id_dh LIKE ?`;
      params.push(`%${orderCode}%`);
    }
    
    if (status) {
      query += ` AND dh.trangthai = ?`;
      params.push(status);
    }
    
    if (fromDate) {
      query += ` AND DATE(dh.ngaydat) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(dh.ngaydat) <= ?`;
      params.push(toDate);
    }
    
    query += ` ORDER BY dh.ngaydat DESC`;
    
    // Thêm phân trang
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    db.all(query, params, callback);
  }

  // Đếm tổng số đơn hàng với bộ lọc
  static countOrders(filters = {}, callback) {
    const { orderCode, status, fromDate, toDate } = filters;
    
    let query = `
      SELECT COUNT(*) as total
      FROM don_hang dh
      LEFT JOIN Users u ON dh.id_user = u.id_user
      WHERE 1=1
    `;
    
    const params = [];
    
    if (orderCode) {
      query += ` AND dh.id_dh LIKE ?`;
      params.push(`%${orderCode}%`);
    }
    
    if (status) {
      query += ` AND dh.trangthai = ?`;
      params.push(status);
    }
    
    if (fromDate) {
      query += ` AND DATE(dh.ngaydat) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(dh.ngaydat) <= ?`;
      params.push(toDate);
    }
    
    db.get(query, params, callback);
  }

  // Lấy đơn hàng theo ID
  static getOrderById(orderId, callback) {
    const query = `
      SELECT 
        dh.id_dh,
        dh.id_user,
        u.hoten as ten_khach_hang,
        u.email as email_khach_hang,
        u.sdt as sdt_khach_hang,
        u.diachi as diachi_khach_hang,
        dh.ngaydat,
        dh.tongtien,
        dh.diachigiaohang,
        dh.sdtnhan,
        dh.trangthai,
        dh.note,
        dh.ngaytao,
        dh.hinh_thuc_thanh_toan,
        dh.trang_thai_thanh_toan,
        dh.ma_xac_nhan,
        dh.ngay_nhan_du_kien,
        dh.id_ma_giam_gia,
        dh.gia_tri_giam_gia,
        dh.tong_tien_truoc_giam,
        mg.ma_code as ma_giam_gia_code,
        mg.ten_ma as ten_ma_giam_gia
      FROM don_hang dh
      LEFT JOIN Users u ON dh.id_user = u.id_user
      LEFT JOIN ma_giam_gia mg ON dh.id_ma_giam_gia = mg.id_ma
      WHERE dh.id_dh = ?
    `;
    
    db.get(query, [orderId], callback);
  }

  // Lấy chi tiết sản phẩm trong đơn hàng
  static getOrderDetails(orderId, callback) {
    const query = `
      SELECT 
        ct.id_ctdh,
        ct.id_sp,
        ct.soluong,
        ct.gia,
        ct.yeucau,
        sp.ten as ten_san_pham,
        sp.ha_url as hinh_anh,
        sp.mota as mota_san_pham,
        (ct.soluong * ct.gia) as thanh_tien
      FROM chi_tiet_don_hang ct
      JOIN san_pham sp ON ct.id_sp = sp.id_sp
      WHERE ct.id_dh = ?
      ORDER BY ct.id_ctdh
    `;
    
    db.all(query, [orderId], callback);
  }

  // Tạo đơn hàng mới
  static createOrder(orderData, callback) {
    const {
      id_user,
      tongtien,
      diachigiaohang,
      sdtnhan,
      note,
      hinh_thuc_thanh_toan,
      trang_thai_thanh_toan = 'Chưa thanh toán',
      ngay_nhan_du_kien,
      id_ma_giam_gia,
      gia_tri_giam_gia = 0,
      tong_tien_truoc_giam
    } = orderData;

    const query = `
      INSERT INTO don_hang (
        id_user, ngaydat, tongtien, diachigiaohang, sdtnhan, 
        trangthai, note, ngaytao, hinh_thuc_thanh_toan, 
        trang_thai_thanh_toan, ngay_nhan_du_kien, id_ma_giam_gia,
        gia_tri_giam_gia, tong_tien_truoc_giam
      ) VALUES (?, datetime('now'), ?, ?, ?, 'Chờ xử lý', ?, datetime('now'), ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id_user, tongtien, diachigiaohang, sdtnhan, note,
      hinh_thuc_thanh_toan, trang_thai_thanh_toan, ngay_nhan_du_kien,
      id_ma_giam_gia, gia_tri_giam_gia, tong_tien_truoc_giam
    ];

    db.run(query, params, callback);
  }

  // Thêm chi tiết đơn hàng
  static addOrderDetail(orderDetailData, callback) {
    const { id_dh, id_sp, soluong, gia, yeucau } = orderDetailData;
    
    const query = `
      INSERT INTO chi_tiet_don_hang (id_dh, id_sp, soluong, gia, yeucau)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(query, [id_dh, id_sp, soluong, gia, yeucau], callback);
  }

  // Cập nhật trạng thái đơn hàng
  static updateOrderStatus(orderId, status, note, callback) {
    const validStatuses = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
    
    if (!validStatuses.includes(status)) {
      return callback(new Error('Trạng thái không hợp lệ'));
    }

    let query = `UPDATE don_hang SET trangthai = ?`;
    let params = [status];
    
    if (note) {
      query += `, note = ?`;
      params.push(note);
    }
    
    query += ` WHERE id_dh = ?`;
    params.push(orderId);
    
    db.run(query, params, callback);
  }

  // Cập nhật thông tin đơn hàng
  static updateOrder(orderId, updateData, callback) {
    const allowedFields = [
      'diachigiaohang', 'sdtnhan', 'trangthai', 'note',
      'hinh_thuc_thanh_toan', 'trang_thai_thanh_toan', 'ngay_nhan_du_kien'
    ];

    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        if (field === 'trangthai') {
          const validStatuses = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
          if (!validStatuses.includes(updateData[field])) {
            return callback(new Error('Trạng thái không hợp lệ'));
          }
        }
        updateFields.push(`${field} = ?`);
        params.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return callback(new Error('Không có thông tin để cập nhật'));
    }

    const query = `UPDATE don_hang SET ${updateFields.join(', ')} WHERE id_dh = ?`;
    params.push(orderId);

    db.run(query, params, callback);
  }

  // Cập nhật ghi chú đơn hàng
  static updateOrderNotes(orderId, notes, callback) {
    const query = `UPDATE don_hang SET note = ? WHERE id_dh = ?`;
    db.run(query, [notes, orderId], callback);
  }

  // Xóa đơn hàng (soft delete)
  static softDeleteOrder(orderId, callback) {
    const query = `UPDATE don_hang SET trangthai = 'Đã hủy' WHERE id_dh = ?`;
    db.run(query, [orderId], callback);
  }

  // Xóa đơn hàng hoàn toàn (hard delete)
  static hardDeleteOrder(orderId, callback) {
    // Xóa chi tiết đơn hàng trước
    const deleteDetailsQuery = `DELETE FROM chi_tiet_don_hang WHERE id_dh = ?`;
    
    db.run(deleteDetailsQuery, [orderId], (err) => {
      if (err) return callback(err);
      
      // Sau đó xóa đơn hàng
      const deleteOrderQuery = `DELETE FROM don_hang WHERE id_dh = ?`;
      db.run(deleteOrderQuery, [orderId], callback);
    });
  }

  // Lấy thống kê đơn hàng
  static getOrderStats(filters = {}, callback) {
    const { fromDate, toDate } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN trangthai = 'Chờ xử lý' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN trangthai = 'Đã xác nhận' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN trangthai = 'Đang giao' THEN 1 ELSE 0 END) as shipping_orders,
        SUM(CASE WHEN trangthai = 'Hoàn thành' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN trangthai = 'Đã hủy' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(tongtien), 0) as total_revenue,
        COALESCE(AVG(tongtien), 0) as average_order_value
      FROM don_hang
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fromDate) {
      query += ` AND DATE(ngaydat) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(ngaydat) <= ?`;
      params.push(toDate);
    }
    
    db.get(query, params, callback);
  }

  // Lấy thống kê theo thời gian
  static getOrderStatsByTime(period = 'daily', filters = {}, callback) {
    const { fromDate, toDate } = filters;
    
    let dateFormat;
    switch (period) {
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }
    
    let query = `
      SELECT 
        strftime('${dateFormat}', ngaydat) as period,
        COUNT(*) as total_orders,
        SUM(tongtien) as total_revenue,
        SUM(CASE WHEN trangthai = 'Hoàn thành' THEN 1 ELSE 0 END) as completed_orders
      FROM don_hang
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fromDate) {
      query += ` AND DATE(ngaydat) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(ngaydat) <= ?`;
      params.push(toDate);
    }
    
    query += ` GROUP BY strftime('${dateFormat}', ngaydat) ORDER BY period`;
    
    db.all(query, params, callback);
  }

  // Lấy đơn hàng theo user ID
  static getOrdersByUserId(userId, callback) {
    const query = `
      SELECT 
        dh.*,
        u.hoten as ten_khach_hang,
        u.email as email_khach_hang
      FROM don_hang dh
      LEFT JOIN Users u ON dh.id_user = u.id_user
      WHERE dh.id_user = ?
      ORDER BY dh.ngaydat DESC
    `;
    
    db.all(query, [userId], callback);
  }

  // Kiểm tra đơn hàng có tồn tại không
  static orderExists(orderId, callback) {
    const query = `SELECT COUNT(*) as count FROM don_hang WHERE id_dh = ?`;
    db.get(query, [orderId], (err, result) => {
      if (err) return callback(err);
      callback(null, result.count > 0);
    });
  }

  // Lấy trạng thái đơn hàng hợp lệ
  static getValidStatuses() {
    return ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
  }

  // Xuất dữ liệu đơn hàng
  static exportOrders(filters = {}, callback) {
    const { orderCode, status, fromDate, toDate } = filters;
    
    let query = `
      SELECT 
        dh.id_dh as 'Mã đơn hàng',
        u.hoten as 'Tên khách hàng',
        u.email as 'Email',
        dh.ngaydat as 'Ngày đặt',
        dh.tongtien as 'Tổng tiền',
        dh.diachigiaohang as 'Địa chỉ giao hàng',
        dh.sdtnhan as 'SĐT nhận hàng',
        dh.trangthai as 'Trạng thái',
        dh.hinh_thuc_thanh_toan as 'Hình thức thanh toán',
        dh.trang_thai_thanh_toan as 'Trạng thái thanh toán',
        dh.ngay_nhan_du_kien as 'Ngày nhận dự kiến',
        dh.note as 'Ghi chú'
      FROM don_hang dh
      LEFT JOIN Users u ON dh.id_user = u.id_user
      WHERE 1=1
    `;
    
    const params = [];
    
    if (orderCode) {
      query += ` AND dh.id_dh LIKE ?`;
      params.push(`%${orderCode}%`);
    }
    
    if (status) {
      query += ` AND dh.trangthai = ?`;
      params.push(status);
    }
    
    if (fromDate) {
      query += ` AND DATE(dh.ngaydat) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(dh.ngaydat) <= ?`;
      params.push(toDate);
    }
    
    query += ` ORDER BY dh.ngaydat DESC`;
    
    db.all(query, params, callback);
  }
}

module.exports = OrderModel;