const db = require('../../config/database');

const Order = {
  // Tạo đơn hàng mới từ giỏ hàng
  createFromCart: (userId, orderData) => {
    const transaction = db.transaction(() => {
      const { 
        diachigiaohang, 
        sdtnhan, 
        note, 
        hinh_thuc_thanh_toan,
        ma_giam_gia_code,
        ngay_nhan_du_kien 
      } = orderData;

      // Lấy thông tin giỏ hàng
      const cartItems = db.prepare(`
        SELECT ctgh.id_sp, ctgh.soluong, sp.gia, sp.gia_khuyen_mai, sp.ten
        FROM chi_tiet_gio_hang ctgh
        JOIN gio_hang gh ON ctgh.id_gh = gh.id_gh
        JOIN san_pham sp ON ctgh.id_sp = sp.id_sp
        WHERE gh.id_user = ? AND ctgh.soluong > 0
      `).all(userId);

      if (cartItems.length === 0) {
        throw new Error('Giỏ hàng trống');
      }

      // Kiểm tra tồn kho
      for (const item of cartItems) {
        const product = db.prepare('SELECT slton FROM san_pham WHERE id_sp = ?').get(item.id_sp);
        if (!product || product.slton < item.soluong) {
          throw new Error(`Sản phẩm "${item.ten}" không đủ số lượng trong kho`);
        }
      }

      // Tính tổng tiền
      let tongTienTruocGiam = 0;
      cartItems.forEach(item => {
        const gia = item.gia_khuyen_mai || item.gia;
        tongTienTruocGiam += gia * item.soluong;
      });

      // Xử lý mã giảm giá
      let maGiamGia = null;
      let giaTriGiam = 0;
      
      if (ma_giam_gia_code) {
        maGiamGia = db.prepare(`
          SELECT * FROM ma_giam_gia 
          WHERE ma_code = ? AND trang_thai = 'hoat_dong'
          AND datetime(ngay_bat_dau) <= datetime('now')
          AND datetime(ngay_ket_thuc) >= datetime('now')
          AND (so_lan_su_dung_toi_da IS NULL OR so_lan_da_su_dung < so_lan_su_dung_toi_da)
        `).get(ma_giam_gia_code);

        if (!maGiamGia) {
          throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }

        if (tongTienTruocGiam < maGiamGia.gia_tri_don_hang_toi_thieu) {
          throw new Error(`Đơn hàng phải có giá trị tối thiểu ${maGiamGia.gia_tri_don_hang_toi_thieu.toLocaleString()}đ để sử dụng mã này`);
        }

        // Tính giá trị giảm
        if (maGiamGia.loai_giam === 'phan_tram') {
          giaTriGiam = Math.floor(tongTienTruocGiam * maGiamGia.gia_tri_giam / 100);
        } else {
          giaTriGiam = maGiamGia.gia_tri_giam;
        }
        
        giaTriGiam = Math.min(giaTriGiam, tongTienTruocGiam);
      }

      const tongTien = tongTienTruocGiam - giaTriGiam;
      const ngayDat = new Date().toISOString();
      const maXacNhan = 'DH' + Date.now().toString().slice(-8);

      // Tạo đơn hàng
      const orderResult = db.prepare(`
        INSERT INTO don_hang (
          id_user, ngaydat, tongtien, diachigiaohang, sdtnhan, 
          trangthai, note, ngaytao, hinh_thuc_thanh_toan, 
          trang_thai_thanh_toan, ma_xac_nhan, ngay_nhan_du_kien,
          id_ma_giam_gia, gia_tri_giam_gia, tong_tien_truoc_giam
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, ngayDat, tongTien, diachigiaohang, sdtnhan,
        'cho_xac_nhan', note, ngayDat, hinh_thuc_thanh_toan,
        'chua_thanh_toan', maXacNhan, ngay_nhan_du_kien,
        maGiamGia ? maGiamGia.id_ma : null, giaTriGiam, tongTienTruocGiam
      );

      const orderId = orderResult.lastInsertRowid;

      // Thêm chi tiết đơn hàng
      const insertDetail = db.prepare(`
        INSERT INTO chi_tiet_don_hang (id_dh, id_sp, soluong, gia)
        VALUES (?, ?, ?, ?)
      `);

      cartItems.forEach(item => {
        const gia = item.gia_khuyen_mai || item.gia;
        insertDetail.run(orderId, item.id_sp, item.soluong, gia);

        // Cập nhật tồn kho
        db.prepare('UPDATE san_pham SET slton = slton - ? WHERE id_sp = ?')
          .run(item.soluong, item.id_sp);
      });

      // Cập nhật số lần sử dụng mã giảm giá
      if (maGiamGia) {
        db.prepare('UPDATE ma_giam_gia SET so_lan_da_su_dung = so_lan_da_su_dung + 1 WHERE id_ma = ?')
          .run(maGiamGia.id_ma);

        // Lưu lịch sử sử dụng mã
        db.prepare(`
          INSERT INTO lich_su_ma_giam_gia (id_ma, id_user, id_don_hang, gia_tri_giam_thuc_te)
          VALUES (?, ?, ?, ?)
        `).run(maGiamGia.id_ma, userId, orderId, giaTriGiam);
      }

      // Xóa giỏ hàng
      const cart = db.prepare('SELECT id_gh FROM gio_hang WHERE id_user = ?').get(userId);
      if (cart) {
        db.prepare('DELETE FROM chi_tiet_gio_hang WHERE id_gh = ?').run(cart.id_gh);
      }

      return orderId;
    });

    try {
      return transaction();
    } catch (error) {
      console.error("Error creating order from cart:", error);
      throw error;
    }
  },

  // Tạo đơn hàng mới từ sản phẩm đơn lẻ
  createFromProduct: (userId, orderData) => {
    const transaction = db.transaction(() => {
      const { 
        id_sp,
        soluong,
        diachigiaohang, 
        sdtnhan, 
        note, 
        hinh_thuc_thanh_toan,
        ma_giam_gia_code,
        ngay_nhan_du_kien 
      } = orderData;

      // Kiểm tra sản phẩm và tồn kho
      const product = db.prepare(`
        SELECT id_sp, ten, gia, gia_khuyen_mai, slton 
        FROM san_pham WHERE id_sp = ?
      `).get(id_sp);

      if (!product) {
        throw new Error('Sản phẩm không tồn tại');
      }

      if (product.slton < soluong) {
        throw new Error(`Sản phẩm "${product.ten}" không đủ số lượng trong kho`);
      }

      const gia = product.gia_khuyen_mai || product.gia;
      let tongTienTruocGiam = gia * soluong;

      // Xử lý mã giảm giá (tương tự như createFromCart)
      let maGiamGia = null;
      let giaTriGiam = 0;
      
      if (ma_giam_gia_code) {
        maGiamGia = db.prepare(`
          SELECT * FROM ma_giam_gia 
          WHERE ma_code = ? AND trang_thai = 'hoat_dong'
          AND datetime(ngay_bat_dau) <= datetime('now')
          AND datetime(ngay_ket_thuc) >= datetime('now')
          AND (so_lan_su_dung_toi_da IS NULL OR so_lan_da_su_dung < so_lan_su_dung_toi_da)
        `).get(ma_giam_gia_code);

        if (!maGiamGia) {
          throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }

        if (tongTienTruocGiam < maGiamGia.gia_tri_don_hang_toi_thieu) {
          throw new Error(`Đơn hàng phải có giá trị tối thiểu ${maGiamGia.gia_tri_don_hang_toi_thieu.toLocaleString()}đ để sử dụng mã này`);
        }

        if (maGiamGia.loai_giam === 'phan_tram') {
          giaTriGiam = Math.floor(tongTienTruocGiam * maGiamGia.gia_tri_giam / 100);
        } else {
          giaTriGiam = maGiamGia.gia_tri_giam;
        }
        
        giaTriGiam = Math.min(giaTriGiam, tongTienTruocGiam);
      }

      const tongTien = tongTienTruocGiam - giaTriGiam;
      const ngayDat = new Date().toISOString();
      const maXacNhan = 'DH' + Date.now().toString().slice(-8);

      // Tạo đơn hàng
      const orderResult = db.prepare(`
        INSERT INTO don_hang (
          id_user, ngaydat, tongtien, diachigiaohang, sdtnhan, 
          trangthai, note, ngaytao, hinh_thuc_thanh_toan, 
          trang_thai_thanh_toan, ma_xac_nhan, ngay_nhan_du_kien,
          id_ma_giam_gia, gia_tri_giam_gia, tong_tien_truoc_giam
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, ngayDat, tongTien, diachigiaohang, sdtnhan,
        'cho_xac_nhan', note, ngayDat, hinh_thuc_thanh_toan,
        'chua_thanh_toan', maXacNhan, ngay_nhan_du_kien,
        maGiamGia ? maGiamGia.id_ma : null, giaTriGiam, tongTienTruocGiam
      );

      const orderId = orderResult.lastInsertRowid;

      // Thêm chi tiết đơn hàng
      db.prepare(`
        INSERT INTO chi_tiet_don_hang (id_dh, id_sp, soluong, gia)
        VALUES (?, ?, ?, ?)
      `).run(orderId, id_sp, soluong, gia);

      // Cập nhật tồn kho
      db.prepare('UPDATE san_pham SET slton = slton - ? WHERE id_sp = ?')
        .run(soluong, id_sp);

      // Cập nhật mã giảm giá nếu có
      if (maGiamGia) {
        db.prepare('UPDATE ma_giam_gia SET so_lan_da_su_dung = so_lan_da_su_dung + 1 WHERE id_ma = ?')
          .run(maGiamGia.id_ma);

        db.prepare(`
          INSERT INTO lich_su_ma_giam_gia (id_ma, id_user, id_don_hang, gia_tri_giam_thuc_te)
          VALUES (?, ?, ?, ?)
        `).run(maGiamGia.id_ma, userId, orderId, giaTriGiam);
      }

      return orderId;
    });

    try {
      return transaction();
    } catch (error) {
      console.error("Error creating order from product:", error);
      throw error;
    }
  },

  // Lấy tất cả đơn hàng của user
  findByUserId: (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT 
        dh.id_dh,
        dh.ma_xac_nhan,
        dh.ngaydat,
        dh.tongtien,
        dh.tong_tien_truoc_giam,
        dh.gia_tri_giam_gia,
        dh.diachigiaohang,
        dh.sdtnhan,
        dh.trangthai,
        dh.note,
        dh.hinh_thuc_thanh_toan,
        dh.trang_thai_thanh_toan,
        dh.ngay_nhan_du_kien,
        mg.ma_code as ma_giam_gia,
        COUNT(ctdh.id_ctdh) as so_san_pham
      FROM don_hang dh
      LEFT JOIN ma_giam_gia mg ON dh.id_ma_giam_gia = mg.id_ma
      LEFT JOIN chi_tiet_don_hang ctdh ON dh.id_dh = ctdh.id_dh
      WHERE dh.id_user = ?
      GROUP BY dh.id_dh
      ORDER BY dh.ngaydat DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM don_hang 
      WHERE id_user = ?
    `;

    try {
      const orders = db.prepare(sql).all(userId, limit, offset);
      const totalResult = db.prepare(countSql).get(userId);
      
      return {
        orders,
        total: totalResult.total,
        page,
        limit,
        totalPages: Math.ceil(totalResult.total / limit)
      };
    } catch (error) {
      console.error("Error finding orders by user ID:", error);
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng
  findById: (orderId, userId) => {
    const orderSql = `
      SELECT 
        dh.*,
        mg.ma_code as ma_giam_gia,
        mg.ten_ma as ten_ma_giam_gia,
        u.hoten as ten_khach_hang,
        u.email as email_khach_hang
      FROM don_hang dh
      LEFT JOIN ma_giam_gia mg ON dh.id_ma_giam_gia = mg.id_ma
      LEFT JOIN Users u ON dh.id_user = u.id_user
      WHERE dh.id_dh = ? AND dh.id_user = ?
    `;

    const detailsSql = `
      SELECT 
        ctdh.*,
        sp.ten as ten_san_pham,
        sp.ha_url as hinh_anh,
        sp.id_loai,
        lsp.ten as ten_loai
      FROM chi_tiet_don_hang ctdh
      JOIN san_pham sp ON ctdh.id_sp = sp.id_sp
      LEFT JOIN loai_san_pham lsp ON sp.id_loai = lsp.id_loai
      WHERE ctdh.id_dh = ?
      ORDER BY ctdh.id_ctdh
    `;

    try {
      const order = db.prepare(orderSql).get(orderId, userId);
      if (!order) {
        return null;
      }

      const details = db.prepare(detailsSql).all(orderId);
      
      return {
        ...order,
        chi_tiet: details
      };
    } catch (error) {
      console.error("Error finding order by ID:", error);
      throw error;
    }
  },

  // Cập nhật thông tin đơn hàng (chỉ cho phép một số trường)
  update: (orderId, userId, updateData) => {
    const { diachigiaohang, sdtnhan, note } = updateData;
    
    // Kiểm tra đơn hàng có thể cập nhật không
    const order = db.prepare(`
      SELECT trangthai, ngaydat 
      FROM don_hang 
      WHERE id_dh = ? AND id_user = ?
    `).get(orderId, userId);

    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    if (!['cho_xac_nhan', 'da_xac_nhan'].includes(order.trangthai)) {
      throw new Error('Không thể cập nhật đơn hàng ở trạng thái này');
    }

    const sql = `
      UPDATE don_hang 
      SET diachigiaohang = ?, sdtnhan = ?, note = ?
      WHERE id_dh = ? AND id_user = ?
    `;

    try {
      const result = db.prepare(sql).run(diachigiaohang, sdtnhan, note, orderId, userId);
      return result.changes;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  // Hủy đơn hàng (trong vòng 24h)
  cancel: (orderId, userId) => {
    const transaction = db.transaction(() => {
      // Kiểm tra đơn hàng
      const order = db.prepare(`
        SELECT * FROM don_hang 
        WHERE id_dh = ? AND id_user = ?
      `).get(orderId, userId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.trangthai === 'da_huy') {
        throw new Error('Đơn hàng đã được hủy trước đó');
      }

      if (!['cho_xac_nhan', 'da_xac_nhan'].includes(order.trangthai)) {
        throw new Error('Không thể hủy đơn hàng ở trạng thái này');
      }

      // Kiểm tra thời gian (24h)
      const orderTime = new Date(order.ngaydat);
      const now = new Date();
      const hoursDiff = (now - orderTime) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throw new Error('Chỉ có thể hủy đơn hàng trong vòng 24 giờ đầu');
      }

      // Cập nhật trạng thái đơn hàng
      db.prepare(`
        UPDATE don_hang 
        SET trangthai = 'da_huy'
        WHERE id_dh = ?
      `).run(orderId);

      // Hoàn lại tồn kho
      const orderDetails = db.prepare(`
        SELECT id_sp, soluong 
        FROM chi_tiet_don_hang 
        WHERE id_dh = ?
      `).all(orderId);

      orderDetails.forEach(detail => {
        db.prepare('UPDATE san_pham SET slton = slton + ? WHERE id_sp = ?')
          .run(detail.soluong, detail.id_sp);
      });

      // Hoàn lại mã giảm giá nếu có
      if (order.id_ma_giam_gia) {
        db.prepare('UPDATE ma_giam_gia SET so_lan_da_su_dung = so_lan_da_su_dung - 1 WHERE id_ma = ?')
          .run(order.id_ma_giam_gia);

        // Xóa lịch sử sử dụng mã
        db.prepare('DELETE FROM lich_su_ma_giam_gia WHERE id_don_hang = ?')
          .run(orderId);
      }

      return true;
    });

    try {
      return transaction();
    } catch (error) {
      console.error("Error canceling order:", error);
      throw error;
    }
  },

  // Kiểm tra mã giảm giá
  validateCoupon: (ma_code, tongTien, userId) => {
    const sql = `
      SELECT * FROM ma_giam_gia 
      WHERE ma_code = ? AND trang_thai = 'hoat_dong'
      AND datetime(ngay_bat_dau) <= datetime('now')
      AND datetime(ngay_ket_thuc) >= datetime('now')
      AND (so_lan_su_dung_toi_da IS NULL OR so_lan_da_su_dung < so_lan_su_dung_toi_da)
    `;

    try {
      const coupon = db.prepare(sql).get(ma_code);
      
      if (!coupon) {
        return { 
          valid: false, 
          message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' 
        };
      }

      if (tongTien < coupon.gia_tri_don_hang_toi_thieu) {
        return { 
          valid: false, 
          message: `Đơn hàng phải có giá trị tối thiểu ${coupon.gia_tri_don_hang_toi_thieu.toLocaleString()}đ` 
        };
      }

      // Tính giá trị giảm
      let giaTriGiam = 0;
      if (coupon.loai_giam === 'phan_tram') {
        giaTriGiam = Math.floor(tongTien * coupon.gia_tri_giam / 100);
      } else {
        giaTriGiam = coupon.gia_tri_giam;
      }
      
      giaTriGiam = Math.min(giaTriGiam, tongTien);

      return {
        valid: true,
        coupon,
        giaTriGiam,
        tongTienSauGiam: tongTien - giaTriGiam
      };
    } catch (error) {
      console.error("Error validating coupon:", error);
      throw error;
    }
  }
};

module.exports = Order;