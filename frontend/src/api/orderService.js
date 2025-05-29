import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';
const CLIENT_API_URL = 'http://localhost:5000/api'; // URL cho client APIs

// ====================== ADMIN APIs ======================
export const fetchOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${API_URL}/orders?${params}`);
  return res.data;
};

export const getOrderById = async (id) => {
  const res = await axios.get(`${API_URL}/orders/${id}`);
  return res.data;
};

export const updateOrderStatus = async (id, status) => {
  const res = await axios.put(`${API_URL}/orders/${id}/status`, { trangthai: status });
  return res.data;
};

export const updateOrderNotes = async (id, notes) => {
  const res = await axios.put(`${API_URL}/orders/${id}/notes`, { notes });
  return res.data;
};

export const deleteOrder = async (id, permanent = false) => {
  const res = await axios.delete(`${API_URL}/orders/${id}`, {
    params: { permanent }
  });
  return res.data;
};

export const exportOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${API_URL}/orders/export?${params}`);
  return res.data;
};

// ====================== CLIENT APIs ======================

/**
 * Tạo đơn hàng từ giỏ hàng
 * @param {Object} orderData - Thông tin đơn hàng
 * @param {string} orderData.diachigiaohang - Địa chỉ giao hàng
 * @param {string} orderData.sdtnhan - Số điện thoại nhận
 * @param {string} orderData.note - Ghi chú đơn hàng
 * @param {string} orderData.hinh_thuc_thanh_toan - Hình thức thanh toán (cod, bank_transfer, momo, vnpay)
 * @param {string} orderData.ma_giam_gia_code - Mã giảm giá (optional)
 * @param {string} orderData.ngay_nhan_du_kien - Ngày nhận dự kiến (optional)
 * @param {string} token - JWT token để xác thực
 */
export const createOrderFromCart = async (orderData, token) => {
  try {
    const res = await axios.post(`${CLIENT_API_URL}/orders/from-cart`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Tạo đơn hàng từ sản phẩm đơn lẻ
 * @param {Object} orderData - Thông tin đơn hàng
 * @param {number} orderData.id_sp - ID sản phẩm
 * @param {number} orderData.soluong - Số lượng
 * @param {string} orderData.diachigiaohang - Địa chỉ giao hàng
 * @param {string} orderData.sdtnhan - Số điện thoại nhận
 * @param {string} orderData.note - Ghi chú đơn hàng
 * @param {string} orderData.hinh_thuc_thanh_toan - Hình thức thanh toán
 * @param {string} orderData.ma_giam_gia_code - Mã giảm giá (optional)
 * @param {string} orderData.ngay_nhan_du_kien - Ngày nhận dự kiến (optional)
 * @param {string} token - JWT token để xác thực
 */
export const createOrderFromProduct = async (orderData, token) => {
  try {
    const res = await axios.post(`${CLIENT_API_URL}/orders/from-product`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Lấy danh sách đơn hàng của user hiện tại
 * @param {Object} params - Tham số phân trang
 * @param {number} params.page - Trang hiện tại (default: 1)
 * @param {number} params.limit - Số lượng đơn hàng mỗi trang (default: 10, max: 50)
 * @param {string} token - JWT token để xác thực
 */
export const getMyOrders = async (params = {}, token) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10
    }).toString();
    
    const res = await axios.get(`${CLIENT_API_URL}/orders/my-orders?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Lấy chi tiết đơn hàng theo ID
 * @param {number} orderId - ID đơn hàng
 * @param {string} token - JWT token để xác thực
 */
export const getOrderDetail = async (orderId, token) => {
  try {
    const res = await axios.get(`${CLIENT_API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Cập nhật thông tin đơn hàng (chỉ cho phép cập nhật khi đơn hàng chưa được xử lý)
 * @param {number} orderId - ID đơn hàng
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {string} updateData.diachigiaohang - Địa chỉ giao hàng mới (optional)
 * @param {string} updateData.sdtnhan - Số điện thoại nhận mới (optional)
 * @param {string} updateData.note - Ghi chú mới (optional)
 * @param {string} token - JWT token để xác thực
 */
export const updateMyOrder = async (orderId, updateData, token) => {
  try {
    const res = await axios.put(`${CLIENT_API_URL}/orders/${orderId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Hủy đơn hàng (chỉ trong vòng 24h sau khi đặt)
 * @param {number} orderId - ID đơn hàng
 * @param {string} token - JWT token để xác thực
 */
export const cancelMyOrder = async (orderId, token) => {
  try {
    const res = await axios.delete(`${CLIENT_API_URL}/orders/${orderId}/cancel`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Kiểm tra và xác thực mã giảm giá
 * @param {Object} couponData - Thông tin mã giảm giá
 * @param {string} couponData.ma_code - Mã giảm giá
 * @param {number} couponData.tong_tien - Tổng tiền đơn hàng
 * @param {string} token - JWT token để xác thực
 */
export const validateCoupon = async (couponData, token) => {
  try {
    const res = await axios.post(`${CLIENT_API_URL}/orders/validate-coupon`, couponData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ====================== UTILITY FUNCTIONS ======================

/**
 * Format tiền tệ VND
 * @param {number} amount - Số tiền
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Format ngày tháng
 * @param {string} date - Ngày tháng ISO string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Mapping trạng thái đơn hàng sang tiếng Việt
 */
export const ORDER_STATUS_MAP = {
  'cho_xac_nhan': 'Chờ xác nhận',
  'da_xac_nhan': 'Đã xác nhận',
  'dang_chuan_bi': 'Đang chuẩn bị',
  'dang_giao': 'Đang giao',
  'da_giao': 'Đã giao',
  'da_huy': 'Đã hủy',
  'tra_hang': 'Trả hàng'
};

/**
 * Mapping hình thức thanh toán sang tiếng Việt
 */
export const PAYMENT_METHOD_MAP = {
  'cod': 'Thanh toán khi nhận hàng',
  'bank_transfer': 'Chuyển khoản ngân hàng',
  'momo': 'Ví MoMo',
  'vnpay': 'VNPay'
};

/**
 * Mapping trạng thái thanh toán sang tiếng Việt
 */
export const PAYMENT_STATUS_MAP = {
  'chua_thanh_toan': 'Chưa thanh toán',
  'da_thanh_toan': 'Đã thanh toán',
  'that_bai': 'Thanh toán thất bại',
  'hoan_tien': 'Đã hoàn tiền'
};

/**
 * Kiểm tra xem đơn hàng có thể hủy được không
 * @param {Object} order - Thông tin đơn hàng
 */
export const canCancelOrder = (order) => {
  if (!order) return false;
  
  // Chỉ cho phép hủy đơn hàng ở trạng thái chờ xác nhận hoặc đã xác nhận
  const cancelableStatuses = ['cho_xac_nhan', 'da_xac_nhan'];
  if (!cancelableStatuses.includes(order.trangthai)) {
    return false;
  }
  
  // Kiểm tra thời gian (24h)
  const orderTime = new Date(order.ngaydat);
  const now = new Date();
  const hoursDiff = (now - orderTime) / (1000 * 60 * 60);
  
  return hoursDiff <= 24;
};

/**
 * Kiểm tra xem đơn hàng có thể cập nhật không
 * @param {Object} order - Thông tin đơn hàng
 */
export const canUpdateOrder = (order) => {
  if (!order) return false;
  
  // Chỉ cho phép cập nhật đơn hàng ở trạng thái chờ xác nhận hoặc đã xác nhận
  const updatableStatuses = ['cho_xac_nhan', 'da_xac_nhan'];
  return updatableStatuses.includes(order.trangthai);
};