import { apiRequest, toQueryString } from '../client';

export const mapsService = {
  list(params: { page?: number; limit?: number; status?: string } = {}) {
    return apiRequest(`/maps${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/maps/${id}`);
  },

  getConfig() {
    return apiRequest<{
      provider: string;
      googleMapsApiKey: string | null;
      enabled: boolean;
    }>('/maps/config', { auth: false });
  },
};

export const notificationsService = {
  list(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      targetAudience?: string;
    } = {},
  ) {
    return apiRequest(`/notifications${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/notifications/${id}`);
  },

  getInbox(limit = 50) {
    return apiRequest<{
      items: Array<{
        _id: string;
        notificationTitle: string;
        message: string;
        notificationType?: string;
        targetAudience?: string;
        status: string;
        sentAt?: string | null;
        createdAt?: string;
        isRead: boolean;
      }>;
      unreadCount: number;
    }>(`/notifications/inbox${toQueryString({ limit })}`);
  },

  getUnreadCount() {
    return apiRequest<{ unreadCount: number }>(
      '/notifications/inbox/unread-count',
    );
  },

  markRead(id: string) {
    return apiRequest<{ ok: true }>(`/notifications/inbox/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllRead() {
    return apiRequest<{ marked: number }>('/notifications/inbox/read-all', {
      method: 'PATCH',
    });
  },
};

export const reportsService = {
  list(
    params: {
      page?: number;
      limit?: number;
      reportType?: string;
      status?: string;
    } = {},
  ) {
    return apiRequest(`/reports${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/reports/${id}`);
  },

  monthlyPlantations(
    params: {
      months?: number;
      vidhanSabha?: string;
      mitraId?: string;
    } = {},
  ) {
    return apiRequest<{
      months: Array<{
        key: string;
        label: string;
        year: number;
        month: number;
        count: number;
        alive: number;
        dead: number;
        heightPct: number;
      }>;
      total: number;
      from: string;
      to: string;
    }>(`/reports/monthly-plantations${toQueryString(params)}`);
  },
};

export const settingsService = {
  list(
    params: { page?: number; limit?: number; category?: string } = {},
  ) {
    return apiRequest(`/settings${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/settings/${id}`);
  },
};

export const callCenterService = {
  list(
    params: {
      page?: number;
      limit?: number;
      contactType?: string;
      status?: string;
    } = {},
  ) {
    return apiRequest(`/call-center${toQueryString(params)}`);
  },
};

export const vidhanSabhasService = {
  list(
    params: {
      page?: number;
      limit?: number;
      district?: string;
      status?: string;
    } = {},
  ) {
    return apiRequest(`/vidhan-sabhas${toQueryString(params)}`, {
      auth: false,
    });
  },
};
