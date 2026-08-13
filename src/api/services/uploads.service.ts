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
      { auth: false },
    );
  },
};
