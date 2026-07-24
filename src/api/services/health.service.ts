import { apiRequest } from '../client';

export const healthService = {
  check() {
    return apiRequest<{
      status: string;
      service: string;
      timestamp: string;
    }>('/health', { auth: false });
  },
};
