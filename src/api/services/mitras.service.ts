import { apiRequest, toQueryString } from '../client';
import type { CreateMitraPayload } from '../types';

export const mitrasService = {
  create(payload: CreateMitraPayload) {
    return apiRequest('/mitras', { method: 'POST', body: payload });
  },

  selfRegister(payload: CreateMitraPayload) {
    return apiRequest<{
      _id: string;
      mitraId: string;
      name: string;
      mobile: string;
      email?: string;
      profession?: string;
      address?: string;
      membership?: string;
      status?: string;
    }>('/mitras/self-register', { method: 'POST', body: payload });
  },

  list(params: { status?: string; search?: string } = {}) {
    return apiRequest(`/mitras${toQueryString(params)}`);
  },

  getByMobile(mobile: string) {
    return apiRequest(`/mitras/mobile/${encodeURIComponent(mobile)}`);
  },

  getByCode(mitraId: string) {
    return apiRequest(`/mitras/code/${encodeURIComponent(mitraId)}`);
  },

  getById(id: string) {
    return apiRequest(`/mitras/${id}`);
  },

  update(id: string, payload: Partial<CreateMitraPayload>) {
    return apiRequest(`/mitras/${id}`, { method: 'PATCH', body: payload });
  },

  remove(id: string) {
    return apiRequest(`/mitras/${id}`, { method: 'DELETE' });
  },
};
