const OrderModel = require('../models/OrderModel');

// Lấy toàn bộ đơn hàng với khả năng lọc
exports.getAllOrders = (req, res) => {
  const filters = {
    orderCode: req.query.orderCode,
    status: req.query.status,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  // Đếm tổng số đơn hàng trước
  OrderModel.countOrders(filters, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const totalOrders = countResult.total;
    const totalPages = Math.ceil(totalOrders / filters.limit);
    
    // Lấy danh sách đơn hàng
    OrderModel.getAllOrders(filters, (err, orders) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        orders: orders,
        pagination: {
          currentPage: filters.page,
          totalPages: totalPages,
          totalOrders: totalOrders,
          limit: filters.limit
        }
      });
    });
  });
};

// Lấy chi tiết đơn hàng theo ID
exports.getOrderById = (req, res) => {
  const orderId = req.params.id;
  
  // Lấy thông tin đơn hàng
  OrderModel.getOrderById(orderId, (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    
    // Lấy chi tiết sản phẩm trong đơn hàng
    OrderModel.getOrderDetails(orderId, (err, orderDetails) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        orderCode: order.id_dh,
        createdAt: order.ngaydat,
        status: order.trangthai,
        paymentMethod: order.hinh_thuc_thanh_toan,
        paymentStatus: order.trang_thai_thanh_toan,
        totalAmount: order.tongtien,
        discount: order.gia_tri_giam_gia || 0,
        subtotal: order.tong_tien_truoc_giam || order.tongtien,
        shippingFee: 0,
        notes: order.note,
        customer: {
          name: order.ten_khach_hang,
          email: order.email_khach_hang,
          phone: order.sdt_khach_hang,
          isVip: false
        },
        shippingAddress: {
          street: order.diachigiaohang || '',
          ward: '', district: '', city: '', country: ''
        },
        billingAddress: null,
        timeline: [],
        items: (orderDetails || []).map(item => ({
          quantity: item.soluong,
          price: item.gia,
          product: {
            name: item.ten_san_pham,
            description: item.mota_san_pham,
            image: item.hinh_anh,
            color: '',
            size: '',
          }
        }))
      });
    });
  });
};

// Tạo đơn hàng mới
exports.createOrder = (req, res) => {
  const orderData = {
    id_user: req.body.id_user,
    tongtien: req.body.tongtien,
    diachigiaohang: req.body.diachigiaohang,
    sdtnhan: req.body.sdtnhan,
    note: req.body.note,
    hinh_thuc_thanh_toan: req.body.hinh_thuc_thanh_toan,
    trang_thai_thanh_toan: req.body.trang_thai_thanh_toan || 'Chưa thanh toán',
    ngay_nhan_du_kien: req.body.ngay_nhan_du_kien,
    id_ma_giam_gia: req.body.id_ma_giam_gia,
    gia_tri_giam_gia: req.body.gia_tri_giam_gia || 0,
    tong_tien_truoc_giam: req.body.tong_tien_truoc_giam
  };

  OrderModel.createOrder(orderData, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    const orderId = this.lastID;
    
    // Thêm chi tiết đơn hàng nếu có
    if (req.body.orderDetails && Array.isArray(req.body.orderDetails)) {
      let detailsProcessed = 0;
      const totalDetails = req.body.orderDetails.length;
      let hasError = false;

      req.body.orderDetails.forEach(detail => {
        const orderDetailData = {
          id_dh: orderId,
          id_sp: detail.id_sp,
          soluong: detail.soluong,
          gia: detail.gia,
          yeucau: detail.yeucau
        };

        OrderModel.addOrderDetail(orderDetailData, (err) => {
          if (err && !hasError) {
            hasError = true;
            return res.status(500).json({ error: err.message });
          }
          
          detailsProcessed++;
          if (detailsProcessed === totalDetails && !hasError) {
            res.json({
              success: true,
              message: 'Tạo đơn hàng thành công',
              id_dh: orderId
            });
          }
        });
      });
    } else {
      res.json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        id_dh: orderId
      });
    }
  });
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { trangthai, note } = req.body;
  
  OrderModel.updateOrderStatus(id, trangthai, note, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    
    res.json({ 
      success: true, 
      message: 'Cập nhật trạng thái đơn hàng thành công',
      id_dh: id,
      trangthai: trangthai
    });
  });
};

// Cập nhật thông tin đơn hàng
exports.updateOrder = (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  OrderModel.updateOrder(id, updateData, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    
    res.json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      id_dh: id
    });
  });
};

// Cập nhật ghi chú đơn hàng
exports.updateOrderNotes = (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  OrderModel.updateOrderNotes(id, notes, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    
    res.json({ 
      success: true, 
      message: 'Cập nhật ghi chú thành công' 
    });
  });
};

// Xóa đơn hàng (soft delete hoặc hard delete)
exports.deleteOrder = (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;
  
  if (permanent === 'true') {
    // Hard delete - xóa hoàn toàn
    OrderModel.hardDeleteOrder(id, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      
      res.json({ 
        success: true, 
        message: 'Xóa đơn hàng thành công', 
        id_dh: id 
      });
    });
  } else {
    // Soft delete - chỉ cập nhật trạng thái
    OrderModel.softDeleteOrder(id, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      
      res.json({
        success: true,
        message: 'Hủy đơn hàng thành công',
        id_dh: id
      });
    });
  }
};

// Lấy thống kê đơn hàng
exports.getOrderStats = (req, res) => {
  const filters = {
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  };
  
  OrderModel.getOrderStats(filters, (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(stats);
  });
};

// Lấy thống kê theo thời gian (cho biểu đồ)
exports.getOrderStatsByTime = (req, res) => {
  const period = req.query.period || 'daily';
  const filters = {
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  };
  
  OrderModel.getOrderStatsByTime(period, filters, (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(stats);
  });
};

// Xuất dữ liệu đơn hàng (để tạo file Excel)
exports.exportOrders = (req, res) => {
  const filters = {
    orderCode: req.query.orderCode,
    status: req.query.status,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  };
  
  OrderModel.exportOrders(filters, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
};

// Lấy đơn hàng theo user ID
exports.getOrdersByUserId = (req, res) => {
  const userId = req.params.userId;
  
  OrderModel.getOrdersByUserId(userId, (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      orders: orders
    });
  });
};

// Kiểm tra đơn hàng có tồn tại không
exports.checkOrderExists = (req, res) => {
  const orderId = req.params.id;
  
  OrderModel.orderExists(orderId, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      exists: exists
    });
  });
};

// Lấy danh sách trạng thái hợp lệ
exports.getValidStatuses = (req, res) => {
  const statuses = OrderModel.getValidStatuses();
  res.json({
    success: true,
    statuses: statuses
  });
};