// backend/admin/controllers/reportsController.js
const ReportsModel = require('../models/ReportsModel');

class ReportsController {
  
  // Lấy báo cáo tổng quan
  static async getReports(req, res) {
    try {
      const { timeRange = '30', category = 'all', reportType = 'overview' } = req.query;
      
      console.log('Getting reports with params:', { timeRange, category, reportType });
      
      let reportData = {};
      
      switch (reportType) {
        case 'overview':
          reportData = await ReportsModel.getDashboardStats(parseInt(timeRange));
          break;
          
        case 'revenue':
          const [summary, revenueChart] = await Promise.all([
            ReportsModel.getSummaryData(parseInt(timeRange), category),
            ReportsModel.getRevenueChart(parseInt(timeRange), 'daily')
          ]);
          reportData = { summary, revenueChart };
          break;
          
        case 'products':
          const [productSummary, topProducts, categoryPerformance] = await Promise.all([
            ReportsModel.getSummaryData(parseInt(timeRange), category),
            ReportsModel.getTopProducts(parseInt(timeRange), 20),
            ReportsModel.getCategoryPerformance(parseInt(timeRange))
          ]);
          reportData = { 
            summary: productSummary, 
            topProducts, 
            categoryPerformance 
          };
          break;
          
        case 'customers':
          const [customerSummary, customerAnalytics] = await Promise.all([
            ReportsModel.getSummaryData(parseInt(timeRange), category),
            ReportsModel.getCustomerAnalytics(parseInt(timeRange))
          ]);
          reportData = { 
            summary: customerSummary, 
            customerAnalytics 
          };
          break;
          
        case 'orders':
          const [orderSummary, revenueData] = await Promise.all([
            ReportsModel.getSummaryData(parseInt(timeRange), category),
            ReportsModel.getRevenueChart(parseInt(timeRange), 'daily')
          ]);
          reportData = { 
            summary: orderSummary, 
            revenueChart: revenueData 
          };
          break;
          
        default:
          reportData = await ReportsModel.getDashboardStats(parseInt(timeRange));
      }
      
      // Đảm bảo có đủ dữ liệu trả về cho frontend
      const response = {
        summary: reportData.summary || {
          totalRevenue: 0,
          totalOrders: 0,
          newCustomers: 0,
          conversionRate: 0,
          netProfit: 0,
          avgOrderValue: 0
        },
        revenueChart: reportData.revenueChart || [],
        categoryPerformance: reportData.categoryPerformance || [],
        topProducts: reportData.topProducts || [],
        customerAnalytics: reportData.customerAnalytics || []
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu báo cáo',
        error: error.message
      });
    }
  }

  // Lấy báo cáo doanh thu theo biểu đồ
  static async getRevenueChart(req, res) {
    try {
      const { timeRange = '30', chartType = 'daily' } = req.query;
      
      const chartData = await ReportsModel.getRevenueChart(
        parseInt(timeRange), 
        chartType
      );
      
      res.status(200).json({
        success: true,
        data: chartData
      });
      
    } catch (error) {
      console.error('Error in getRevenueChart:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu biểu đồ doanh thu',
        error: error.message
      });
    }
  }

  // Lấy hiệu suất danh mục
  static async getCategoryPerformance(req, res) {
    try {
      const { timeRange = '30' } = req.query;
      
      const categoryData = await ReportsModel.getCategoryPerformance(parseInt(timeRange));
      
      res.status(200).json({
        success: true,
        data: categoryData
      });
      
    } catch (error) {
      console.error('Error in getCategoryPerformance:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu hiệu suất danh mục',
        error: error.message
      });
    }
  }

  // Lấy sản phẩm bán chạy
  static async getTopProducts(req, res) {
    try {
      const { timeRange = '30', limit = '10' } = req.query;
      
      const topProducts = await ReportsModel.getTopProducts(
        parseInt(timeRange), 
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: topProducts
      });
      
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu sản phẩm bán chạy',
        error: error.message
      });
    }
  }

  // Lấy phân tích khách hàng
  static async getCustomerAnalytics(req, res) {
    try {
      const { timeRange = '30' } = req.query;
      
      const customerData = await ReportsModel.getCustomerAnalytics(parseInt(timeRange));
      
      res.status(200).json({
        success: true,
        data: customerData
      });
      
    } catch (error) {
      console.error('Error in getCustomerAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu phân tích khách hàng',
        error: error.message
      });
    }
  }

  // Xuất báo cáo ra file
  static async exportReport(req, res) {
    try {
      const { type = 'overview', format = 'json', timeRange = '30' } = req.query;
      
      let data = {};
      
      switch (type) {
        case 'products':
          data = await ReportsModel.getTopProducts(parseInt(timeRange), 100);
          break;
        case 'customers':
          data = await ReportsModel.getCustomerAnalytics(parseInt(timeRange));
          break;
        case 'revenue':
          data = await ReportsModel.getRevenueChart(parseInt(timeRange), 'daily');
          break;
        case 'categories':
          data = await ReportsModel.getCategoryPerformance(parseInt(timeRange));
          break;
        default:
          data = await ReportsModel.getDashboardStats(parseInt(timeRange));
      }
      
      if (format === 'csv') {
        // Tạo CSV data
        const csvData = ReportsController.convertToCSV(data, type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        // Trả về JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${Date.now()}.json"`);
        res.json(data);
      }
      
    } catch (error) {
      console.error('Error in exportReport:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất báo cáo',
        error: error.message
      });
    }
  }

  // Lấy tổng quan nhanh cho dashboard
  static async getQuickStats(req, res) {
    try {
      const { timeRange = '30' } = req.query;
      
      const stats = await ReportsModel.getSummaryData(parseInt(timeRange));
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Error in getQuickStats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê nhanh',
        error: error.message
      });
    }
  }

  // Helper method: Convert data to CSV
  static convertToCSV(data, type) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return '';
    }
    
    let csvContent = '';
    
    switch (type) {
      case 'products':
        csvContent = 'Tên sản phẩm,Số lượng,Doanh thu,Số đơn hàng,Tỷ lệ %\n';
        data.forEach(item => {
          csvContent += `"${item.name}",${item.quantity},${item.revenue},${item.orders},${item.percentage}%\n`;
        });
        break;
        
      case 'customers':
        csvContent = 'Phân khúc,Số lượng,Doanh thu,Tỷ lệ %\n';
        data.forEach(item => {
          csvContent += `"${item.segment}",${item.count},${item.revenue},${item.percentage}%\n`;
        });
        break;
        
      case 'categories':
        csvContent = 'Danh mục,Doanh thu,Số đơn hàng,Số sản phẩm,Tỷ lệ %\n';
        data.forEach(item => {
          csvContent += `"${item.name}",${item.revenue},${item.orders},${item.products},${item.percentage}%\n`;
        });
        break;
        
      case 'revenue':
        csvContent = 'Thời gian,Doanh thu,Số đơn hàng\n';
        data.forEach(item => {
          csvContent += `"${item.label}",${item.value},${item.orders}\n`;
        });
        break;
        
      default:
        csvContent = JSON.stringify(data, null, 2);
    }
    
    return csvContent;
  }

  // Validate admin access (middleware có thể dùng)
  static validateAdminAccess(req, res, next) {
    // Kiểm tra token hoặc session admin
    const token = req.headers.authorization || req.session?.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }
    
    next();
  }
}

module.exports = ReportsController;