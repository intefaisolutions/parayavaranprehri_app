import { apiRequest, toQueryString } from '../client';

export type LeaderboardScope = 'vidhan-sabha' | 'city' | 'state';
export type LeaderboardPeriod = 'month' | 'year';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  trees: number;
  aliveTrees?: number;
  survivalPct?: number;
  co2Kg: number;
  vidhanSabha?: string | null;
  badge?: string;
  personId?: string | null;
  userId?: string | null;
  mobile?: string | null;
  totalParticipants?: number;
};

export type LeaderboardResponse = {
  scope?: LeaderboardScope;
  period?: LeaderboardPeriod;
  items: LeaderboardEntry[];
};

export type LeaderboardQuery = {
  scope?: LeaderboardScope;
  period?: LeaderboardPeriod;
  limit?: number;
  /** Specific constituency when scope is vidhan-sabha */
  vidhanSabha?: string;
  city?: string;
  state?: string;
};

export type LeaderboardFilters = {
  vidhanSabhas: string[];
  states: string[];
  cities: string[];
};

export const leaderboardService = {
  list(params: LeaderboardQuery = {}) {
    return apiRequest<LeaderboardResponse>(
      `/leaderboard${toQueryString(params)}`,
    );
  },

  me(params: LeaderboardQuery = {}) {
    return apiRequest<LeaderboardEntry & { totalParticipants: number }>(
      `/leaderboard/me${toQueryString(params)}`,
    );
  },

  filters() {
    return apiRequest<LeaderboardFilters>('/leaderboard/filters', {
      auth: false,
    });
  },
};
