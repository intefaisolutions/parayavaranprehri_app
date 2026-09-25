import { apiRequest } from '../client';

export type ContentType = 'privacy_policy' | 'terms_conditions' | 'about_us';

export type ContentItem = {
  _id: string;
  type: ContentType;
  /** HTML string from the backend */
  content: string;
  version: number;
  status: 'DRAFT' | 'LIVE';
  createdAt: string;
  updatedAt: string;
};

export const contentService = {
  /**
   * GET /content/:type — public, no auth required.
   * Resolves to the ContentItem returned in data.content (HTML string).
   */
  getContent(type: ContentType) {
    return apiRequest<ContentItem>(`/content/${type}`, {
      method: 'GET',
      auth: false,
    });
  },
};
