import { create } from 'zustand';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    api.post('/auth/logout').catch(console.error).finally(() => {
      set({ user: null, isAuthenticated: false });
    });
  },
}));

export default useAuthStore;
