import { apiRequest } from '../client';

export type MissionProgress = {
  percent: number;
  label: string;
  targetYear: number;
  targetTrees?: number;
  totalTrees?: number;
  updatedAt?: string;
};

export const missionProgressService = {
  get() {
    return apiRequest<MissionProgress>('/mission-progress');
  },
};
