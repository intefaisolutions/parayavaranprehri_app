import { apiRequest, toQueryString } from '../client';
import type { CreateLandOfferPayload } from '../types';

export type LandOfferItem = {
  _id: string;
  fullName?: string;
  mobile?: string;
  address: string;
  landmark?: string;
  landSize: string;
  availableArea?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const landOffersService = {
  create(payload: CreateLandOfferPayload) {
    return apiRequest<LandOfferItem>('/land-offers', {
      method: 'POST',
      body: payload,
    });
  },

  list(mobile?: string) {
    return apiRequest<LandOfferItem[]>(`/land-offers/me${toQueryString({ mobile })}`);
  },

  listMine(mobile?: string) {
    return apiRequest<LandOfferItem[]>(`/land-offers/me${toQueryString({ mobile })}`);
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
