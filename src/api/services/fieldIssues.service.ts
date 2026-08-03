import { apiRequest, toQueryString } from '../client';

export type FieldIssueApi = {
  _id: string;
  type: string;
  priority: string;
  description: string;
  treeCode?: string;
  status: string;
  createdAt?: string;
};

export type CreateFieldIssuePayload = {
  type: string;
  priority?: string;
  description: string;
  treeCode?: string;
  photoUrls?: string[];
};

export const fieldIssuesService = {
  create(payload: CreateFieldIssuePayload) {
    return apiRequest('/field-issues', { method: 'POST', body: payload });
  },

  list(params: { status?: string; mine?: boolean } = {}) {
    return apiRequest<FieldIssueApi[]>(
      `/field-issues${toQueryString({
        status: params.status,
        mine: params.mine ? 'true' : undefined,
      })}`,
    );
  },
};
