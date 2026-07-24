import { apiRequest } from '../client';
import type { ApiVehicle, CreateVehiclePayload } from '../types';

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
