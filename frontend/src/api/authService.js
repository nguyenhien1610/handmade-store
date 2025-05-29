// /home/huyen/handmade-store/frontend/src/api/authService.js
import axios from './axios';

const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';
const CLIENT_TOKEN_KEY = 'clientToken';
const CLIENT_USER_KEY = 'clientUser';

const authService = {
  // Admin methods
  login: async (username, password) => {
    try {
      const response = await axios.post('/api/admin/auth/login', { username, password });

      if (response.data.success && response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        return { success: false };
      }

      const response = await axios.get('/api/admin/auth/check', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Auth check failed:', error);
      return { success: false };
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Client methods
  clientLogin: async (email, password) => {
    try {
      console.log('[auth] clientLogin attempt for:', email);
      
      const response = await axios.post('/api/client/auth/login', { email, password });
      
      console.log('[auth] Login response:', response.data);
      
      if (response.data.success && response.data.token) {
        console.log('[auth] Setting auth data...');
        authService.setAuthData(response.data.token, response.data.user);
        
        // Verify data was saved
        const savedToken = authService.getToken();
        const savedUser = authService.getClientUser();
        console.log('[auth] Verification after save:', { 
          hasSavedToken: !!savedToken, 
          hasSavedUser: !!savedUser 
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('[auth] Login error:', error);
      throw error;
    }
  },

  clientLogout: () => {
    console.log('[auth] clientLogout called');
    authService.clearAuthData();
  },

  getClientUser: () => {
    try {
      const userStr = localStorage.getItem(CLIENT_USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      console.log('[auth] getClientUser result:', !!user);
      return user;
    } catch (error) {
      console.error('[auth] Error getting client user:', error);
      return null;
    }
  },

  getToken: () => {
    try {
      const token = localStorage.getItem(CLIENT_TOKEN_KEY);
      console.log('[auth] getToken result:', !!token);
      return token;
    } catch (error) {
      console.error('[auth] Error getting token:', error);
      return null;
    }
  },
  
  clearAuthData: () => {
    console.log('[auth] clearAuthData called');
    try {
      localStorage.removeItem(CLIENT_TOKEN_KEY);
      localStorage.removeItem(CLIENT_USER_KEY);
      console.log('[auth] Auth data cleared successfully');
    } catch (error) {
      console.error('[auth] Error clearing auth data:', error);
    }
  },

  handleAuthError: () => {
    console.log('[auth] handleAuthError called');
    authService.clearAuthData();
    if (window.location.pathname !== '/login') {
      console.log('[auth] Redirecting to login...');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    const user = authService.getClientUser();
    const isAuth = !!(token && user);
    console.log('[auth] isAuthenticated check:', { hasToken: !!token, hasUser: !!user, result: isAuth });
    return isAuth;
  },

  setAuthData: (token, user) => {
    try {
      console.log('[auth] setAuthData called with:', { 
        hasToken: !!token, 
        hasUser: !!user,
        tokenLength: token?.length,
        userId: user?.id || user?.id_user 
      });
      
      if (!token || !user) {
        console.error('[auth] Invalid auth data provided');
        return;
      }
      
      localStorage.setItem(CLIENT_TOKEN_KEY, token);
      localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(user));
      
      // Immediate verification
      const savedToken = localStorage.getItem(CLIENT_TOKEN_KEY);
      const savedUser = localStorage.getItem(CLIENT_USER_KEY);
      
      console.log('[auth] Auth data saved:', { 
        tokenSaved: savedToken === token,
        userSaved: !!savedUser,
        storageWorks: typeof Storage !== 'undefined'
      });
      
    } catch (error) {
      console.error('[auth] Error setting auth data:', error);
    }
  },

  // Thêm method để debug localStorage
  debugStorage: () => {
    console.log('[auth] Storage debug:', {
      localStorage: typeof Storage !== 'undefined',
      clientToken: !!localStorage.getItem(CLIENT_TOKEN_KEY),
      clientUser: !!localStorage.getItem(CLIENT_USER_KEY),
      allKeys: Object.keys(localStorage),
      clientTokenValue: localStorage.getItem(CLIENT_TOKEN_KEY)?.substring(0, 20) + '...'
    });
  }
};

export default authService;