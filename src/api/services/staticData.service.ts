import { apiRequest } from '../client';
import type {
  StaticGamification,
  StaticInitiativeInfo,
  StaticMitraCard,
  StaticNewsItem,
  StaticRashiItem,
} from '../types';

export const staticDataService = {
  getMitraCard() {
    return apiRequest<StaticMitraCard>('/static-data/mitra-card');
  },

  getGamification() {
    return apiRequest<StaticGamification>('/static-data/gamification');
  },

  getRashiVan() {
    return apiRequest<StaticRashiItem[]>('/static-data/rashi-van');
  },

  getNews() {
    return apiRequest<StaticNewsItem[]>('/static-data/news');
  },

  getInitiativeInfo() {
    return apiRequest<StaticInitiativeInfo>('/static-data/initiative-info');
  },
};
