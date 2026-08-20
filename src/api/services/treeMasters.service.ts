import { apiRequest, toQueryString } from '../client';

export type TreeMasterApi = {
  _id: string;
  treeMasterId: string;
  name: string;
  scientificName?: string;
  species?: string;
  category?: string;
  oxygenRateKgPerYear: number;
  co2RateKgPerYear: number;
  waterRequirement: string;
  growthRate: string;
  suitableClimate?: string;
  description?: string;
  benefits: string[];
  image?: string;
  availability: string;
};

export type PaginatedResult<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
};

export const treeMastersService = {
  catalog(params: { search?: string; limit?: number; page?: number } = {}) {
    return apiRequest<PaginatedResult<TreeMasterApi>>(
      `/tree-masters/catalog${toQueryString(params)}`,
    );
  },

  getById(id: string) {
    return apiRequest<TreeMasterApi>(`/tree-masters/${id}`);
  },
};
