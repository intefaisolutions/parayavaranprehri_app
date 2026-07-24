import { apiRequest, toQueryString } from '../client';

export type CreateRolePayload = {
  name: string;
  displayName: string;
  description?: string;
  permissionKeys?: string[];
  isActive?: boolean;
};

export type RoleQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
};

export const rolesService = {
  create(payload: CreateRolePayload) {
    return apiRequest('/roles', { method: 'POST', body: payload });
  },

  list(query: RoleQuery = {}) {
    return apiRequest(`/roles${toQueryString(query)}`);
  },

  getById(id: string) {
    return apiRequest(`/roles/${id}`);
  },

  update(id: string, payload: Partial<CreateRolePayload>) {
    return apiRequest(`/roles/${id}`, { method: 'PATCH', body: payload });
  },

  remove(id: string) {
    return apiRequest(`/roles/${id}`, { method: 'DELETE' });
  },
};

export const permissionsService = {
  list(query: RoleQuery = {}) {
    return apiRequest(`/permissions${toQueryString(query)}`);
  },
};
