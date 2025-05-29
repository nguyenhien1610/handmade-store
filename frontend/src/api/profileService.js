import api from './axios';

const profileService = {
  // Lấy thông tin profile
  getProfile: async () => {
    try {
      const response = await api.get('/client/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật thông tin profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/client/profile/update', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/client/profile/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default profileService;