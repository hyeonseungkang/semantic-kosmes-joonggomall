import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: { id: string; email: string; role: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token, user });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ accessToken: null, user: null });
  },
}));
