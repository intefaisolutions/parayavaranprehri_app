import { apiRequest, toQueryString } from '../client';
import { ApiError } from '../types';

const INBOX_BASES = ['/users/me/notifications', '/notifications/inbox'] as const;

async function inboxRequest<T>(
  suffix: string,
  options?: Parameters<typeof apiRequest>[1],
) {
  let lastError: unknown;
  for (const base of INBOX_BASES) {
    try {
      return await apiRequest<T>(`${base}${suffix}`, options);
    } catch (error) {
      lastError = error;
      if (
        error instanceof ApiError &&
        (error.status === 403 || error.status === 404)
      ) {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

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
    return inboxRequest<{
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
    }>(toQueryString({ limit }));
  },

  getUnreadCount() {
    return inboxRequest<{ unreadCount: number }>('/unread-count');
  },

  markRead(id: string) {
    return inboxRequest<{ ok: true }>(`/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllRead() {
    return inboxRequest<{ marked: number }>('/read-all', {
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
