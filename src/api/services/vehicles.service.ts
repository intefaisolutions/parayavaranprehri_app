import { apiRequest } from '../client';
import type { ApiVehicle, CreateVehiclePayload } from '../types';

export type VehicleTreeItem = {
  _id: string;
  treeId?: string;
  treeName?: string;
  species?: string;
  status?: string;
  plantedDate?: string;
  height?: number;
  oxygenKg?: number;
  co2Kg?: number;
  image?: string | null;
  vidhanSabha?: string | null;
};

export type VehicleTreesResponse = {
  vehicleId: string;
  plate: string;
  trees: VehicleTreeItem[];
  totalTrees: number;
};

export const vehiclesService = {
  create(payload: CreateVehiclePayload) {
    return apiRequest<ApiVehicle>('/vehicles', {
      method: 'POST',
      body: payload,
    });
  },

  list() {
    return apiRequest<ApiVehicle[]>('/vehicles');
  },

  getById(id: string) {
    return apiRequest<ApiVehicle>(`/vehicles/${id}`);
  },

  getTrees(id: string) {
    return apiRequest<VehicleTreesResponse>(`/vehicles/${id}/trees`);
  },

  update(id: string, payload: Partial<CreateVehiclePayload>) {
    return apiRequest<ApiVehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(id: string) {
    return apiRequest<ApiVehicle>(`/vehicles/${id}`, { method: 'DELETE' });
  },
};
