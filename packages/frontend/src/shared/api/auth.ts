import { apiClient } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password }).then((r) => r.data),

  register: (email: string, password: string, role: 'buyer' | 'seller' = 'buyer') =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/register', { email, password, role }).then((r) => r.data),

  getMe: () => apiClient.get('/users/me').then((r) => r.data),
};
