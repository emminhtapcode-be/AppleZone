import { create } from 'zustand';
import api from '../services/api';

const useProductStore = create((set) => ({
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/products');
      set({ products: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchProductById: async (id) => {
    set({ isLoading: true, error: null, currentProduct: null });
    try {
      const data = await api.get(`/products/${id}`);
      set({ currentProduct: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));

export default useProductStore;
