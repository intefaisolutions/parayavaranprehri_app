import { apiRequest } from '../client';
import type { CreateGreenSelfiePayload } from '../types';

export const greenSelfiesService = {
  create(payload: CreateGreenSelfiePayload) {
    return apiRequest('/green-selfies', { method: 'POST', body: payload });
  },

  list() {
    return apiRequest('/green-selfies');
  },

  getById(id: string) {
    return apiRequest(`/green-selfies/${id}`);
  },

  update(id: string, payload: Partial<CreateGreenSelfiePayload>) {
    return apiRequest(`/green-selfies/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest(`/green-selfies/${id}`, { method: 'DELETE' });
  },
};
