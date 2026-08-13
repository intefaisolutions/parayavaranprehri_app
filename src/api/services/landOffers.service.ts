import { apiRequest } from '../client';
import type { CreateLandOfferPayload } from '../types';

export type LandOfferItem = {
  _id: string;
  fullName?: string;
  address: string;
  landSize: string;
  availableArea?: string;
  status?: string;
  createdAt?: string;
};

export const landOffersService = {
  create(payload: CreateLandOfferPayload) {
    return apiRequest<LandOfferItem>('/land-offers', {
      method: 'POST',
      body: payload,
    });
  },

  list() {
    return apiRequest<LandOfferItem[]>('/land-offers');
  },

  getById(id: string) {
    return apiRequest<LandOfferItem>(`/land-offers/${id}`);
  },

  update(id: string, payload: Partial<CreateLandOfferPayload>) {
    return apiRequest<LandOfferItem>(`/land-offers/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest<LandOfferItem>(`/land-offers/${id}`, {
      method: 'DELETE',
    });
  },
};
