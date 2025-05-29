// /home/huyen/handmade-store/frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../api/authService';

// Tạo Context và export ngay tại đây
export const AuthContext = createContext(null);

// Custom hook để sử dụng Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  // Admin auth state
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  
  // Client auth state
  const [clientUser, setClientUser] = useState(null);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xác thực admin
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setAdminLoading(false);
          return;
        }
        
        const response = await authService.checkAuth();
        if (response.success) {
          setAdminUser(response.user);
        }
      } catch (error) {
        console.error('Admin auth check failed:', error);
      } finally {
        setAdminLoading(false);
      }
    };

    // Kiểm tra xác thực client
    const checkClientAuth = () => {
      try {
        const token = localStorage.getItem('clientToken');
        if (!token) {
          setClientLoading(false);
          return;
        }
        
        const user = authService.getClientUser();
        if (user) {
          setClientUser(user);
        }
      } catch (error) {
        console.error('Client auth check failed:', error);
      } finally {
        setClientLoading(false);
      }
    };

    // Chạy cả hai hàm kiểm tra
    checkAdminAuth();
    checkClientAuth();
  }, []);

  // Admin auth methods
  const adminLogin = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        setAdminUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const adminLogout = () => {
    authService.logout();
    setAdminUser(null);
  };

  // Client auth methods
  const clientRegister = async (userData) => {
    try {
      return await authService.clientRegister(userData);
    } catch (error) {
      console.error('Client register error:', error);
      throw error;
    }
  };

  const clientLogin = async (email, password) => {
    try {
      const response = await authService.clientLogin(email, password);
      if (response.success) {
        setClientUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Client login error:', error);
      throw error;
    }
  };

  const clientLogout = () => {
    authService.clientLogout();
    setClientUser(null);
  };

  // Các giá trị được cung cấp qua context
  const value = {
    // Admin auth
    adminUser,
    adminLoading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated: !!adminUser,
    
    // Client auth
    clientUser,
    clientLoading,
    clientRegister,
    clientLogin,
    clientLogout,
    isClientAuthenticated: !!clientUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};