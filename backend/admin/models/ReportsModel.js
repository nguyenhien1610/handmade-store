// backend/admin/models/reportsModel.js
const Database = require('../../config/database');
const db = Database;

class reportModel {
  
  // Lấy tổng quan doanh thu
  static async getSummaryData(timeRange = 30, category = 'all') {
    try {
      const dateCondition = this.getDateCondition(timeRange);
      const categoryCondition = category === 'all' ? '' : 'AND sp.id_loai = ?';
      
      // Query tổng doanh thu và số đơn hàng
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT dh.id_dh) as totalOrders,
          COALESCE(SUM(dh.tongtien), 0) as totalRevenue,
          COALESCE(AVG(dh.tongtien), 0) as avgOrderValue,
          COUNT(DISTINCT dh.id_user) as totalCustomers
        FROM don_hang dh
        LEFT JOIN chi_tiet_don_hang ctdh ON dh.id_dh = ctdh.id_dh
        LEFT JOIN san_pham sp ON ctdh.id_sp = sp.id_sp
        WHERE dh.trangthai != 'huy' AND ${dateCondition}
        ${categoryCondition}
      `;
      
      const params = category === 'all' ? [] : [this.getCategoryId(category)];
      const summaryResult = await this.queryAsync(summaryQuery, params);
      
      // Query khách hàng mới
      const newCustomersQuery = `
        SELECT COUNT(DISTINCT id_user) as newCustomers
        FROM Users 
        WHERE ${this.getDateCondition(timeRange, 'ngaytao')}
      `;
      const newCustomersResult = await this.queryAsync(newCustomersQuery);
      
      // Query tỷ lệ chuyển đổi (giả định dựa trên số lượt xem vs đơn hàng)
      const conversionRate = this.calculateConversionRate(summaryResult[0].totalOrders);
      
      // Tính lợi nhuận ròng (giả định 30% biên lợi nhuận)
      const netProfit = summaryResult[0].totalRevenue * 0.3;
      
      return {
        totalRevenue: summaryResult[0].totalRevenue || 0,
        totalOrders: summaryResult[0].totalOrders || 0,
        avgOrderValue: summaryResult[0].avgOrderValue || 0,
        totalCustomers: summaryResult[0].totalCustomers || 0,
        newCustomers: newCustomersResult[0].newCustomers || 0,
        conversionRate: conversionRate,
        netProfit: netProfit
      };
    } catch (error) {
      console.error('Error in getSummaryData:', error);
      throw error;
    }
  }

  // Lấy dữ liệu biểu đồ doanh thu theo thời gian
  static async getRevenueChart(timeRange = 30, chartType = 'daily') {
    try {
      let dateFormat, groupBy;
      
      switch(chartType) {
        case 'daily':
          dateFormat = "DATE(ngaydat)";
          groupBy = "DATE(ngaydat)";
          break;
        case 'weekly':
          dateFormat = "strftime('%Y-W%W', ngaydat)";
          groupBy = "strftime('%Y-W%W', ngaydat)";
          break;
        case 'monthly':
          dateFormat = "strftime('%Y-%m', ngaydat)";
          groupBy = "strftime('%Y-%m', ngaydat)";
          break;
        default:
          dateFormat = "DATE(ngaydat)";
          groupBy = "DATE(ngaydat)";
      }

      const query = `
        SELECT 
          ${dateFormat} as period,
          COALESCE(SUM(tongtien), 0) as revenue,
          COUNT(id_dh) as orders
        FROM don_hang 
        WHERE trangthai != 'huy' AND ${this.getDateCondition(timeRange)}
        GROUP BY ${groupBy}
        ORDER BY period ASC
        LIMIT 30
      `;

      const result = await this.queryAsync(query);
      
      return result.map(row => ({
        label: this.formatChartLabel(row.period, chartType),
        value: row.revenue,
        orders: row.orders
      }));
    } catch (error) {
      console.error('Error in getRevenueChart:', error);
      throw error;
    }
  }

  // Lấy hiệu suất theo danh mục
  static async getCategoryPerformance(timeRange = 30) {
    try {
      const query = `
        SELECT 
          lsp.ten as categoryName,
          lsp.id_loai,
          COALESCE(SUM(dh.tongtien * (ctdh.soluong * ctdh.gia / dh.tongtien)), 0) as revenue,
          COUNT(DISTINCT dh.id_dh) as orders,
          COUNT(DISTINCT ctdh.id_sp) as products
        FROM loai_san_pham lsp
        LEFT JOIN san_pham sp ON lsp.id_loai = sp.id_loai
        LEFT JOIN chi_tiet_don_hang ctdh ON sp.id_sp = ctdh.id_sp
        LEFT JOIN don_hang dh ON ctdh.id_dh = dh.id_dh AND dh.trangthai != 'huy' AND ${this.getDateCondition(timeRange, 'dh.ngaydat')}
        GROUP BY lsp.id_loai, lsp.ten
        ORDER BY revenue DESC
      `;

      const result = await this.queryAsync(query);
      const totalRevenue = result.reduce((sum, row) => sum + row.revenue, 0);
      
      const colors = ['primary', 'success', 'warning', 'info', 'secondary'];
      
      return result.map((row, index) => ({
        name: row.categoryName,
        revenue: row.revenue,
        orders: row.orders,
        products: row.products,
        percentage: totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : 0,
        colorClass: colors[index % colors.length]
      }));
    } catch (error) {
      console.error('Error in getCategoryPerformance:', error);
      throw error;
    }
  }

  // Lấy sản phẩm bán chạy
  static async getTopProducts(timeRange = 30, limit = 10) {
    try {
      const query = `
        SELECT 
          sp.ten as productName,
          sp.id_sp,
          SUM(ctdh.soluong) as totalQuantity,
          SUM(ctdh.soluong * ctdh.gia) as totalRevenue,
          COUNT(DISTINCT ctdh.id_dh) as orderCount
        FROM san_pham sp
        INNER JOIN chi_tiet_don_hang ctdh ON sp.id_sp = ctdh.id_sp
        INNER JOIN don_hang dh ON ctdh.id_dh = dh.id_dh
        WHERE dh.trangthai != 'huy' AND ${this.getDateCondition(timeRange, 'dh.ngaydat')}
        GROUP BY sp.id_sp, sp.ten
        ORDER BY totalRevenue DESC
        LIMIT ?
      `;

      const result = await this.queryAsync(query, [limit]);
      const maxRevenue = result.length > 0 ? result[0].totalRevenue : 1;
      
      return result.map(row => ({
        name: row.productName,
        quantity: row.totalQuantity,
        revenue: row.totalRevenue,
        orders: row.orderCount,
        percentage: ((row.totalRevenue / maxRevenue) * 100).toFixed(1)
      }));
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      throw error;
    }
  }

  // Phân tích khách hàng
  static async getCustomerAnalytics(timeRange = 30) {
    try {
      const queries = {
        // Khách hàng mới
        newCustomers: `
          SELECT 
            'Khách hàng mới' as segment,
            COUNT(*) as count,
            0 as revenue
          FROM Users 
          WHERE ${this.getDateCondition(timeRange, 'ngaytao')}
        `,
        
        // Khách hàng thường xuyên (>= 3 đơn)
        regularCustomers: `
          SELECT 
            'Khách hàng thường xuyên' as segment,
            COUNT(DISTINCT user_data.id_user) as count,
            COALESCE(SUM(user_data.total_spent), 0) as revenue
          FROM (
            SELECT 
              u.id_user,
              SUM(dh.tongtien) as total_spent,
              COUNT(dh.id_dh) as order_count
            FROM Users u
            LEFT JOIN don_hang dh ON u.id_user = dh.id_user 
              AND dh.trangthai != 'huy' 
              AND ${this.getDateCondition(timeRange, 'dh.ngaydat')}
            GROUP BY u.id_user
            HAVING order_count >= 3
          ) user_data
        `,
        
        // Khách hàng VIP (đơn hàng > 1 triệu)
        vipCustomers: `
          SELECT 
            'Khách hàng VIP' as segment,
            COUNT(DISTINCT user_data.id_user) as count,
            COALESCE(SUM(user_data.total_spent), 0) as revenue
          FROM (
            SELECT 
              u.id_user,
              SUM(dh.tongtien) as total_spent
            FROM Users u
            LEFT JOIN don_hang dh ON u.id_user = dh.id_user 
              AND dh.trangthai != 'huy' 
              AND ${this.getDateCondition(timeRange, 'dh.ngaydat')}
            GROUP BY u.id_user
            HAVING total_spent > 1000000
          ) user_data
        `
      };

      const results = await Promise.all([
        this.queryAsync(queries.newCustomers),
        this.queryAsync(queries.regularCustomers),
        this.queryAsync(queries.vipCustomers)
      ]);

      const customerSegments = [
        ...results[0],
        ...results[1], 
        ...results[2]
      ];

      const totalRevenue = customerSegments.reduce((sum, segment) => sum + segment.revenue, 0);
      
      return customerSegments.map(segment => ({
        segment: segment.segment,
        count: segment.count,
        revenue: segment.revenue,
        percentage: totalRevenue > 0 ? ((segment.revenue / totalRevenue) * 100).toFixed(1) : 0
      }));
    } catch (error) {
      console.error('Error in getCustomerAnalytics:', error);
      throw error;
    }
  }

  // Lấy thống kê tổng hợp cho dashboard
  static async getDashboardStats(timeRange = 30) {
    try {
      const [summary, revenueChart, categoryPerformance, topProducts, customerAnalytics] = await Promise.all([
        this.getSummaryData(timeRange),
        this.getRevenueChart(timeRange),
        this.getCategoryPerformance(timeRange),
        this.getTopProducts(timeRange),
        this.getCustomerAnalytics(timeRange)
      ]);

      return {
        summary,
        revenueChart,
        categoryPerformance,
        topProducts,
        customerAnalytics
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  // Helper methods
  static getDateCondition(days, dateColumn = 'ngaydat') {
    return `${dateColumn} >= datetime('now', '-${days} days')`;
  }

  static getCategoryId(category) {
    const categoryMap = {
      'handmade': 1,
      'jewelry': 2,
      'home-decor': 3,
      'clothing': 4,
      'accessories': 5
    };
    return categoryMap[category] || 1;
  }

  static calculateConversionRate(totalOrders) {
    // Giả định tỷ lệ chuyển đổi dựa trên số đơn hàng
    const estimatedVisitors = totalOrders * 25; // 1 đơn hàng / 25 lượt xem
    return totalOrders > 0 ? ((totalOrders / estimatedVisitors) * 100).toFixed(1) : 0;
  }

  static formatChartLabel(period, chartType) {
    switch(chartType) {
      case 'daily':
        return new Date(period).toLocaleDateString('vi-VN');
      case 'weekly':
        return `Tuần ${period.split('-W')[1]}`;
      case 'monthly':
        return new Date(period + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      default:
        return period;
    }
  }

  // Promise wrapper cho database query
  static queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = reportModel;