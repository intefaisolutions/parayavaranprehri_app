import { apiRequest } from '../client';
import type {
  StaticInitiativeInfo,
  StaticMitraCard,
  StaticNewsItem,
  StaticRashiItem,
} from '../types';

export const staticDataService = {
  getMitraCard() {
    return apiRequest<StaticMitraCard>('/static-data/mitra-card');
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
