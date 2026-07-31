import { apiRequest, toQueryString } from '../client';

export type NewsItemApi = {
  _id: string;
  title: string;
  content: string;
  category?: string;
  image?: string;
  author?: string;
  publishedDate?: string;
  views?: number;
  tags?: string[];
  status?: string;
  createdAt?: string;
};

export const newsService = {
  list(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      status?: string;
    } = {},
  ) {
    return apiRequest<NewsItemApi[] | { items: NewsItemApi[]; meta: unknown }>(
      `/news${toQueryString(params)}`,
    );
  },

  getById(id: string) {
    return apiRequest<NewsItemApi>(`/news/${id}`);
  },
};
