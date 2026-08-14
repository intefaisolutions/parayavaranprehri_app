import { apiRequest, toQueryString } from '../client';

export type Leader = {
  _id: string;
  leaderName: string;
  designation: string;
  organization?: string;
  photo?: string;
  displayOrder?: number;
  isActive?: boolean;
  updatedAt?: string;
};

export type Partner = {
  _id: string;
  partnerName: string;
  partnerType?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  location?: string;
  logo?: string;
  status?: string;
};

export const leadersService = {
  list(
    params: {
      page?: number;
      limit?: number;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    return apiRequest<Leader[] | { items: Leader[]; meta: unknown }>(
      `/leaders${toQueryString({
        sortBy: 'displayOrder',
        sortOrder: 'asc',
        ...params,
      })}`,
    );
  },

  getById(id: string) {
    return apiRequest<Leader>(`/leaders/${id}`);
  },
};

export const partnersService = {
  list(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      partnerType?: string;
    } = {},
  ) {
    return apiRequest<Partner[] | { items: Partner[]; meta: unknown }>(
      `/partners${toQueryString(params)}`,
    );
  },

  getById(id: string) {
    return apiRequest<Partner>(`/partners/${id}`);
  },
};
