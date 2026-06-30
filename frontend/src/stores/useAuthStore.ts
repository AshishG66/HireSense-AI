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
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken?: string, refreshToken?: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (user, accessToken, refreshToken) => set({ user, accessToken: accessToken || null, refreshToken: refreshToken || null, isAuthenticated: true }),
  setAccessToken: (token: string) => set({ accessToken: token }),
  setRefreshToken: (token: string) => set({ refreshToken: token }),
  logout: () => {
    const rfToken = useAuthStore.getState().refreshToken;
    api.post('/auth/logout', { refreshToken: rfToken }).catch(console.error).finally(() => {
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    });
  },
}));

export default useAuthStore;
