import { apiRequest, toQueryString } from '../client';

export type Setting = {
  _id: string;
  settingName: string;
  category: string;
  value: string;
  isActive: boolean;
};

export const settingsService = {
  list(query?: Record<string, string | number | boolean | undefined | null>) {
    const qs = query ? toQueryString(query) : '';
    return apiRequest<{ items: Setting[] }>(`/settings${qs}`);
  },
};
