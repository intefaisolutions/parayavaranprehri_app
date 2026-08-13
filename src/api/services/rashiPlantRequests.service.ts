import { apiRequest, toQueryString } from '../client';
import { getAccessToken } from '../storage';

export type CreateRashiPlantRequestPayload = {
  rashiName: string;
  rashiNameHindi?: string;
  recommendedTree: string;
  scientificName?: string;
  localName?: string;
  treeDescription?: string;
  benefits?: string[];
  remarks?: string;
  userName: string;
  mobile: string;
  email?: string;
  district?: string;
  state?: string;
  userId?: string;
};

export type RashiPlantRequestApi = {
  _id: string;
  requestId: string;
  userName?: string;
  mobile?: string;
  rashiName: string;
  recommendedTree: string;
  status: string;
  createdAt?: string;
};

export const rashiPlantRequestsService = {
  async create(payload: CreateRashiPlantRequestPayload) {
    // Endpoint is @Public on backend; send token when available (optional).
    const token = await getAccessToken();
    return apiRequest<RashiPlantRequestApi>('/rashi-plant-requests', {
      method: 'POST',
      body: payload,
      auth: Boolean(token),
    });
  },

  list(params: { status?: string; mine?: boolean } = {}) {
    return apiRequest<RashiPlantRequestApi[]>(
      `/rashi-plant-requests${toQueryString({
        status: params.status,
        mine: params.mine ? 'true' : undefined,
      })}`,
    );
  },
};
