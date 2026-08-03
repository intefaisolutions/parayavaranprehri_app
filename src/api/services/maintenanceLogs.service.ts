import { apiRequest, toQueryString } from '../client';

export type MaintenanceLogApi = {
  _id: string;
  treeCode: string;
  activity: string;
  remarks?: string;
  loggedAt?: string;
  createdAt?: string;
};

export type CreateMaintenanceLogPayload = {
  treeCode: string;
  activity: string;
  remarks?: string;
  photoUrls?: string[];
};

export const maintenanceLogsService = {
  create(payload: CreateMaintenanceLogPayload) {
    return apiRequest('/maintenance-logs', { method: 'POST', body: payload });
  },

  list(params: { treeCode?: string; mine?: boolean } = {}) {
    return apiRequest<MaintenanceLogApi[]>(
      `/maintenance-logs${toQueryString({
        treeCode: params.treeCode,
        mine: params.mine ? 'true' : undefined,
      })}`,
    );
  },
};
