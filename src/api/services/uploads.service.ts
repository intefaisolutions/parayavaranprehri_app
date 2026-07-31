import { apiRequest, apiUpload, toQueryString } from '../client';

export const uploadsService = {
  upload(
    file: { uri: string; name: string; type: string },
    category:
      | 'users'
      | 'certificates'
      | 'trees'
      | 'documents'
      | 'general' = 'general',
  ) {
    return apiUpload<{ url: string; key: string }>('/uploads', file, {
      category,
    });
  },

  signed(params: { url?: string; key?: string }) {
    return apiRequest<{ signedUrl: string }>(
      `/uploads/signed${toQueryString(params)}`,
    );
  },
};

export const mediaService = {
  list(
    params: {
      page?: number;
      limit?: number;
      mediaType?: string;
      usedInModule?: string;
    } = {},
  ) {
    return apiRequest(`/media${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest(`/media/${id}`);
  },
};
