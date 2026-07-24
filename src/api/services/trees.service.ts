import { apiRequest } from '../client';
import type { ApiTree } from '../types';

export type CreateTreePayload = {
  treeName: string;
  userId: string;
  userName: string;
  mobile: string;
  species?: string;
  scientificName?: string;
  vehicleNumber?: string;
  policyNumber?: string;
  insuranceStatus?: 'ACTIVE' | 'EXPIRED' | 'NOT_INSURED';
  plantedDate?: string;
  plantedBy?: string;
  state?: string;
  district?: string;
  city?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: 'PLANTED' | 'HEALTHY' | 'GROWING' | 'DAMAGED' | 'DEAD';
  height?: number;
  remarks?: string;
  image?: string;
};

export const treesService = {
  create(payload: CreateTreePayload) {
    return apiRequest<ApiTree>('/trees', { method: 'POST', body: payload });
  },

  list() {
    return apiRequest<ApiTree[]>('/trees');
  },

  listByMobile(mobile: string) {
    return apiRequest<ApiTree[]>(`/trees/user/${encodeURIComponent(mobile)}`);
  },

  getById(id: string) {
    return apiRequest<ApiTree>(`/trees/${id}`);
  },

  update(id: string, payload: Partial<CreateTreePayload>) {
    return apiRequest<ApiTree>(`/trees/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest(`/trees/${id}`, { method: 'DELETE' });
  },
};
