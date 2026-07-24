import { apiRequest } from '../client';
import type { CreateLandOfferPayload } from '../types';

export const landOffersService = {
  create(payload: CreateLandOfferPayload) {
    return apiRequest('/land-offers', { method: 'POST', body: payload });
  },

  list() {
    return apiRequest('/land-offers');
  },

  getById(id: string) {
    return apiRequest(`/land-offers/${id}`);
  },

  update(id: string, payload: Partial<CreateLandOfferPayload>) {
    return apiRequest(`/land-offers/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest(`/land-offers/${id}`, { method: 'DELETE' });
  },
};
