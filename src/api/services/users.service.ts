import { apiRequest, toQueryString } from '../client';
import type { ApiVehicle } from '../types';

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  password?: string;
  permissions?: string[];
  isActive?: boolean;
  avatar?: string;
  organizationId?: string;
  district?: string;
  state?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'email'>>;

export type UserQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: string;
  isActive?: boolean;
  district?: string;
  state?: string;
};

export const usersService = {
  create(payload: CreateUserPayload) {
    return apiRequest('/users', { method: 'POST', body: payload });
  },

  getMyVehicles() {
    return apiRequest<ApiVehicle[]>('/users/me/vehicles');
  },

  list(query: UserQuery = {}) {
    return apiRequest(`/users${toQueryString(query)}`);
  },

  getById(id: string) {
    return apiRequest(`/users/${id}`);
  },

  update(id: string, payload: UpdateUserPayload) {
    return apiRequest(`/users/${id}`, { method: 'PATCH', body: payload });
  },

  remove(id: string) {
    return apiRequest(`/users/${id}`, { method: 'DELETE' });
  },
};
