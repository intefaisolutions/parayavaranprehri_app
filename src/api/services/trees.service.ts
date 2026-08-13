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

  getAnalytics(id: string) {
    return apiRequest<{
      treeId?: string;
      species?: string;
      status?: string;
      plantedDate?: string;
      height?: number | null;
      oxygenKg?: number;
      co2Kg?: number;
      monthlyPhotos?: string[];
      monthlySeries?: Array<{
        label: string;
        progress: number;
        photoUrl?: string;
      }>;
      progress?: number;
      vehicleNumber?: string | null;
      vidhanSabha?: string | null;
      treeAgeYears?: number;
      image?: string | null;
    }>(`/trees/${id}/analytics`);
  },

  update(id: string, payload: Partial<CreateTreePayload>) {
    return apiRequest<ApiTree>(`/trees/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  verify(
    id: string,
    payload: {
      status?: CreateTreePayload['status'];
      remarks?: string;
      image?: string;
    } = {},
  ) {
    return apiRequest<ApiTree>(`/trees/${id}/verify`, {
      method: 'PATCH',
      body: payload,
    });
  },

  assignMitra(id: string, mitraId: string) {
    return apiRequest<ApiTree>(`/trees/${id}/assign-mitra`, {
      method: 'PATCH',
      body: { mitraId },
    });
  },

  remove(id: string) {
    return apiRequest(`/trees/${id}`, { method: 'DELETE' });
  },
};
