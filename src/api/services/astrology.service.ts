import { apiRequest } from '../client';

export type CalculateRashiPayload = {
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm:ss
  birthPlace: string;
};

export type CalculateRashiResponse = {
  rashi: string;
  rashiEnglish?: string;
  birthDetails?: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    birthPlace?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
};

export const astrologyService = {
  calculateRashi(payload: CalculateRashiPayload) {
    return apiRequest<CalculateRashiResponse>('/astrology/rashi', {
      method: 'POST',
      body: payload,
    });
  },
};
