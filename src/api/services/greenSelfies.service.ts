import { apiRequest } from '../client';
import type {
  CreateGreenSelfiePayload,
  GreenSelfieListItem,
} from '../types';

export type GreenSelfieItem = GreenSelfieListItem;

export const greenSelfiesService = {
  create(payload: CreateGreenSelfiePayload) {
    return apiRequest<GreenSelfieItem>('/green-selfies', {
      method: 'POST',
      body: payload,
    });
  },

  list() {
    return apiRequest<GreenSelfieItem[]>('/green-selfies');
  },

  getById(id: string) {
    return apiRequest<GreenSelfieItem>(`/green-selfies/${id}`);
  },

  update(id: string, payload: Partial<CreateGreenSelfiePayload>) {
    return apiRequest<GreenSelfieItem>(`/green-selfies/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest<GreenSelfieItem>(`/green-selfies/${id}`, {
      method: 'DELETE',
    });
  },
};
