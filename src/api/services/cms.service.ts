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

export const locationsService = {
  list(
    params: {
      page?: number;
      limit?: number;
      locationType?: string;
      status?: string;
    } = {},
  ) {
    return apiRequest(`/locations${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/locations/${id}`);
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
    return apiRequest(`/vidhan-sabhas${toQueryString(params)}`);
  },
};
