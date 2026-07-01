import { create } from 'zustand';
import api from '../services/api';

const useCartStore = create((set, get) => ({
  cartItems: [],
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/cart');
      set({ cartItems: data.items || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addToCart: async (variant_id, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/cart/add', { variant_id, quantity });
      // Refresh cart after adding
      await get().fetchCart();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  removeFromCart: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/cart/items/${itemId}`);
      // Refresh cart after removing
      await get().fetchCart();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));

export default useCartStore;
