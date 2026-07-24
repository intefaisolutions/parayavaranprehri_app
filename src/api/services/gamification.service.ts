import { apiRequest } from '../client';

export const gamificationService = {
  create(payload: Record<string, unknown> = {}) {
    return apiRequest('/gamification', { method: 'POST', body: payload });
  },

  list() {
    return apiRequest('/gamification');
  },

  getById(id: string | number) {
    return apiRequest(`/gamification/${id}`);
  },

  update(id: string | number, payload: Record<string, unknown> = {}) {
    return apiRequest(`/gamification/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string | number) {
    return apiRequest(`/gamification/${id}`, { method: 'DELETE' });
  },
};
