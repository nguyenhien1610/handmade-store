// frontend/src/services/reportsService.js
import axios from './axios';

const reportsService = {
  /**
   * Lấy báo cáo tổng quan với các filter
   * @param {Object} params - Tham số filter
   * @param {string} params.timeRange - Khoảng thời gian (7, 30, 90, 180, 365)
   * @param {string} params.category - Danh mục (all, handmade, jewelry, home-decor, clothing, accessories)
   * @param {string} params.reportType - Loại báo cáo (overview, revenue, products, customers, orders)
   */
  getReports: async (params = {}) => {
    try {
      const { timeRange = '30', category = 'all', reportType = 'overview' } = params;
      
      const response = await axios.get('/api/admin/reports', {
        params: {
          timeRange,
          category,
          reportType
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu biểu đồ doanh thu
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   * @param {string} params.chartType - Loại biểu đồ (daily, weekly, monthly)
   */
  getRevenueChart: async (params = {}) => {
    try {
      const { timeRange = '30', chartType = 'daily' } = params;
      
      const response = await axios.get('/api/admin/reports/revenue-chart', {
        params: {
          timeRange,
          chartType
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      throw error;
    }
  },

  /**
   * Lấy hiệu suất theo danh mục
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   */
  getCategoryPerformance: async (params = {}) => {
    try {
      const { timeRange = '30' } = params;
      
      const response = await axios.get('/api/admin/reports/category-performance', {
        params: {
          timeRange
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching category performance:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sản phẩm bán chạy
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   * @param {string} params.limit - Số lượng sản phẩm trả về
   */
  getTopProducts: async (params = {}) => {
    try {
      const { timeRange = '30', limit = '10' } = params;
      
      const response = await axios.get('/api/admin/reports/top-products', {
        params: {
          timeRange,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  /**
   * Lấy phân tích khách hàng
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   */
  getCustomerAnalytics: async (params = {}) => {
    try {
      const { timeRange = '30' } = params;
      
      const response = await axios.get('/api/admin/reports/customer-analytics', {
        params: {
          timeRange
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê nhanh cho dashboard
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   */
  getQuickStats: async (params = {}) => {
    try {
      const { timeRange = '30' } = params;
      
      const response = await axios.get('/api/admin/reports/quick-stats', {
        params: {
          timeRange
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  },

  /**
   * Xuất báo cáo ra file
   * @param {Object} params - Tham số
   * @param {string} params.type - Loại báo cáo (overview, products, customers, revenue, categories)
   * @param {string} params.format - Định dạng file (json, csv)
   * @param {string} params.timeRange - Khoảng thời gian
   */
  exportReport: async (params = {}) => {
    try {
      const { type = 'overview', format = 'json', timeRange = '30' } = params;
      
      const response = await axios.get('/api/admin/reports/export', {
        params: {
          type,
          format,
          timeRange
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        // Tạo file download cho CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${type}_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'File đã được tải xuống' };
      } else {
        // Tạo file download cho JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${type}_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'File đã được tải xuống' };
      }
      
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  /**
   * Lấy tất cả dữ liệu dashboard cùng lúc
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   * @param {string} params.category - Danh mục
   */
  getDashboardData: async (params = {}) => {
    try {
      const { timeRange = '30', category = 'all' } = params;
      
      // Gọi song song tất cả các API cần thiết
      const [
        overviewData,
        revenueChart,
        categoryPerformance,
        topProducts,
        customerAnalytics,
        quickStats
      ] = await Promise.all([
        reportsService.getReports({ timeRange, category, reportType: 'overview' }),
        reportsService.getRevenueChart({ timeRange, chartType: 'daily' }),
        reportsService.getCategoryPerformance({ timeRange }),
        reportsService.getTopProducts({ timeRange, limit: '10' }),
        reportsService.getCustomerAnalytics({ timeRange }),
        reportsService.getQuickStats({ timeRange })
      ]);
      
      return {
        overview: overviewData,
        revenueChart: revenueChart.data || revenueChart,
        categoryPerformance: categoryPerformance.data || categoryPerformance,
        topProducts: topProducts.data || topProducts,
        customerAnalytics: customerAnalytics.data || customerAnalytics,
        quickStats: quickStats.data || quickStats
      };
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu so sánh theo thời gian
   * @param {Object} params - Tham số
   * @param {string} params.currentPeriod - Thời gian hiện tại
   * @param {string} params.previousPeriod - Thời gian trước đó
   * @param {string} params.category - Danh mục
   */
  getComparisonData: async (params = {}) => {
    try {
      const { currentPeriod = '30', previousPeriod = '30', category = 'all' } = params;
      
      const [currentData, previousData] = await Promise.all([
        reportsService.getReports({ 
          timeRange: currentPeriod, 
          category, 
          reportType: 'overview' 
        }),
        reportsService.getReports({ 
          timeRange: previousPeriod, 
          category, 
          reportType: 'overview' 
        })
      ]);
      
      // Tính toán tỷ lệ tăng trưởng
      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
      };
      
      const comparison = {
        revenue: {
          current: currentData.summary?.totalRevenue || 0,
          previous: previousData.summary?.totalRevenue || 0,
          growth: calculateGrowth(
            currentData.summary?.totalRevenue || 0,
            previousData.summary?.totalRevenue || 0
          )
        },
        orders: {
          current: currentData.summary?.totalOrders || 0,
          previous: previousData.summary?.totalOrders || 0,
          growth: calculateGrowth(
            currentData.summary?.totalOrders || 0,
            previousData.summary?.totalOrders || 0
          )
        },
        customers: {
          current: currentData.summary?.newCustomers || 0,
          previous: previousData.summary?.newCustomers || 0,
          growth: calculateGrowth(
            currentData.summary?.newCustomers || 0,
            previousData.summary?.newCustomers || 0
          )
        },
        avgOrderValue: {
          current: currentData.summary?.avgOrderValue || 0,
          previous: previousData.summary?.avgOrderValue || 0,
          growth: calculateGrowth(
            currentData.summary?.avgOrderValue || 0,
            previousData.summary?.avgOrderValue || 0
          )
        }
      };
      
      return {
        current: currentData,
        previous: previousData,
        comparison
      };
      
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu doanh thu theo multiple chart types
   * @param {Object} params - Tham số
   * @param {string} params.timeRange - Khoảng thời gian
   */
  getRevenueAnalytics: async (params = {}) => {
    try {
      const { timeRange = '30' } = params;
      
      const [dailyChart, weeklyChart, monthlyChart] = await Promise.all([
        reportsService.getRevenueChart({ timeRange, chartType: 'daily' }),
        reportsService.getRevenueChart({ timeRange, chartType: 'weekly' }),
        reportsService.getRevenueChart({ timeRange, chartType: 'monthly' })
      ]);
      
      return {
        daily: dailyChart.data || dailyChart,
        weekly: weeklyChart.data || weeklyChart,
        monthly: monthlyChart.data || monthlyChart
      };
      
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }
};

export default reportsService;