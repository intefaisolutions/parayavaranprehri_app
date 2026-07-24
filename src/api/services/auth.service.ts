import { apiRequest } from '../client';
import type {
  AuthResponse,
  TokenPair,
} from '../types';

export const authService = {
  login(email: string, password: string) {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
  },

  requestOtp(params: { phone?: string; email?: string }) {
    return apiRequest<{ message: string }>('/auth/otp/request', {
      method: 'POST',
      auth: false,
      body: params,
    });
  },

  verifyOtp(params: { phone?: string; email?: string; code: string }) {
    return apiRequest<AuthResponse>('/auth/otp/verify', {
      method: 'POST',
      auth: false,
      body: params,
    });
  },

  refresh(refreshToken: string) {
    return apiRequest<TokenPair>('/auth/refresh', {
      method: 'POST',
      auth: false,
      body: { refreshToken },
    });
  },

  logout(refreshToken: string) {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      auth: false,
      body: { refreshToken },
    });
  },
};
