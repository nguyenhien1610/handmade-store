import axios from 'axios';

// Khi sử dụng proxy, không cần baseURL đầy đủ
const axiosInstance = axios.create({
  baseURL: '', // Để trống vì đã sử dụng proxy
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Thêm interceptor để xử lý lỗi
// ✅ Gắn token vào mọi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clientToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi authentication
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Chỉ logout khi thực sự cần thiết
    if (error.response?.status === 401) {
      // Check nếu đang ở trang cần auth
      const protectedRoutes = ['/profile', '/orders', '/admin'];
      const currentPath = window.location.pathname;
      
      if (protectedRoutes.some(route => currentPath.startsWith(route))) {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientUser');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;