import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      // Giả sử API trả về user info cùng với token, hoặc mình có thể lấy từ jwt decode
      set({ user: data.user || null, token: data.token, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi đăng nhập', isLoading: false });
      return false;
    }
  },

  register: async (userInfo) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', userInfo);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi đăng ký', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
