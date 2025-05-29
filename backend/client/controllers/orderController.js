const Order = require('../models/orderModel');

const OrderController = {
  // Tạo đơn hàng từ giỏ hàng
  createFromCart: async (req, res) => {
    try {
      const userId = req.user.id_user; // Từ middleware auth
      const {
        diachigiaohang,
        sdtnhan,
        note,
        hinh_thuc_thanh_toan,
        ma_giam_gia_code,
        ngay_nhan_du_kien
      } = req.body;

      // Validate dữ liệu đầu vào
      if (!diachigiaohang || !sdtnhan || !hinh_thuc_thanh_toan) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: địa chỉ giao hàng, số điện thoại, hình thức thanh toán'
        });
      }

      // Validate số điện thoại
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(sdtnhan)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ'
        });
      }

      // Validate hình thức thanh toán
      const validPaymentMethods = ['cod', 'bank_transfer', 'momo', 'vnpay'];
      if (!validPaymentMethods.includes(hinh_thuc_thanh_toan)) {
        return res.status(400).json({
          success: false,
          message: 'Hình thức thanh toán không hợp lệ'
        });
      }

      const orderData = {
        diachigiaohang: diachigiaohang.trim(),
        sdtnhan: sdtnhan.trim(),
        note: note ? note.trim() : '',
        hinh_thuc_thanh_toan,
        ma_giam_gia_code: ma_giam_gia_code ? ma_giam_gia_code.trim() : null,
        ngay_nhan_du_kien
      };

      const orderId = Order.createFromCart(userId, orderData);

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: {
          id_dh: orderId
        }
      });

    } catch (error) {
      console.error('Error in createFromCart:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tạo đơn hàng'
      });
    }
  },

  // Tạo đơn hàng từ sản phẩm đơn lẻ
  createFromProduct: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const {
        id_sp,
        soluong,
        diachigiaohang,
        sdtnhan,
        note,
        hinh_thuc_thanh_toan,
        ma_giam_gia_code,
        ngay_nhan_du_kien
      } = req.body;

      // Validate dữ liệu đầu vào
      if (!id_sp || !soluong || !diachigiaohang || !sdtnhan || !hinh_thuc_thanh_toan) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
        });
      }

      // Validate số lượng
      if (!Number.isInteger(soluong) || soluong <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng phải là số nguyên dương'
        });
      }

      // Validate số điện thoại
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(sdtnhan)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ'
        });
      }

      // Validate hình thức thanh toán
      const validPaymentMethods = ['cod', 'bank_transfer', 'momo', 'vnpay'];
      if (!validPaymentMethods.includes(hinh_thuc_thanh_toan)) {
        return res.status(400).json({
          success: false,
          message: 'Hình thức thanh toán không hợp lệ'
        });
      }

      const orderData = {
        id_sp: parseInt(id_sp),
        soluong: parseInt(soluong),
        diachigiaohang: diachigiaohang.trim(),
        sdtnhan: sdtnhan.trim(),
        note: note ? note.trim() : '',
        hinh_thuc_thanh_toan,
        ma_giam_gia_code: ma_giam_gia_code ? ma_giam_gia_code.trim() : null,
        ngay_nhan_du_kien
      };

      const orderId = Order.createFromProduct(userId, orderData);

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: {
          id_dh: orderId
        }
      });

    } catch (error) {
      console.error('Error in createFromProduct:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tạo đơn hàng'
      });
    }
  },

  // Lấy danh sách đơn hàng của user
  getMyOrders: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Validate pagination
      if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          message: 'Tham số phân trang không hợp lệ'
        });
      }

      const result = Order.findByUserId(userId, page, limit);

      res.json({
        success: true,
        message: 'Lấy danh sách đơn hàng thành công',
        data: result
      });

    } catch (error) {
      console.error('Error in getMyOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách đơn hàng'
      });
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const orderId = parseInt(req.params.id);

      if (!orderId || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID đơn hàng không hợp lệ'
        });
      }

      const order = Order.findById(orderId, userId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      res.json({
        success: true,
        message: 'Lấy chi tiết đơn hàng thành công',
        data: order
      });

    } catch (error) {
      console.error('Error in getOrderDetail:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy chi tiết đơn hàng'
      });
    }
  },

  // Cập nhật thông tin đơn hàng
  updateOrder: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const orderId = parseInt(req.params.id);
      const { diachigiaohang, sdtnhan, note } = req.body;

      if (!orderId || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID đơn hàng không hợp lệ'
        });
      }

      // Validate dữ liệu đầu vào
      if (!diachigiaohang && !sdtnhan && note === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cần ít nhất một thông tin để cập nhật'
        });
      }

      // Validate số điện thoại nếu có
      if (sdtnhan) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(sdtnhan)) {
          return res.status(400).json({
            success: false,
            message: 'Số điện thoại không hợp lệ'
          });
        }
      }

      const updateData = {};
      if (diachigiaohang) updateData.diachigiaohang = diachigiaohang.trim();
      if (sdtnhan) updateData.sdtnhan = sdtnhan.trim();
      if (note !== undefined) updateData.note = note.trim();

      const updated = Order.update(orderId, userId, updateData);

      if (updated === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng hoặc không thể cập nhật'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật đơn hàng thành công'
      });

    } catch (error) {
      console.error('Error in updateOrder:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi cập nhật đơn hàng'
      });
    }
  },

  // Hủy đơn hàng
  cancelOrder: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const orderId = parseInt(req.params.id);

      if (!orderId || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID đơn hàng không hợp lệ'
        });
      }

      const result = Order.cancel(orderId, userId);

      if (result) {
        res.json({
          success: true,
          message: 'Hủy đơn hàng thành công'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Không thể hủy đơn hàng'
        });
      }

    } catch (error) {
      console.error('Error in cancelOrder:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi hủy đơn hàng'
      });
    }
  },

  // Kiểm tra mã giảm giá
  validateCoupon: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const { ma_code, tong_tien } = req.body;

      if (!ma_code || !tong_tien) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu mã giảm giá hoặc tổng tiền'
        });
      }

      if (typeof tong_tien !== 'number' || tong_tien <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Tổng tiền không hợp lệ'
        });
      }

      const result = Order.validateCoupon(ma_code.trim(), tong_tien, userId);

      res.json({
        success: true,
        message: result.valid ? 'Mã giảm giá hợp lệ' : 'Mã giảm giá không hợp lệ',
        data: result
      });

    } catch (error) {
      console.error('Error in validateCoupon:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi kiểm tra mã giảm giá'
      });
    }
  }
};

module.exports = OrderController;