import { apiRequest, toQueryString } from '../client';

export type ReverseGeocodeResult = {
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  district: string;
  tehsil: string;
  villageOrCity: string;
  pinCode: string;
  landAddress: string;
  landmark: string;
  vidhanSabha: string | null;
  vidhanSabhaId: string | null;
  rawDisplayName?: string;
  source: string;
};

export type ConstituencyItem = {
  _id?: string;
  id?: string;
  name?: string;
  vidhanSabhaName?: string;
  state?: string;
  district?: string;
};

export const geoService = {
  reverse(latitude: number, longitude: number) {
    return apiRequest<ReverseGeocodeResult>('/geo/reverse', {
      method: 'POST',
      body: { latitude, longitude },
    });
  },

  listConstituencies(params: {
    state: string;
    district: string;
    country?: string;
  }) {
    return apiRequest<ConstituencyItem[]>(
      `/geo/constituencies${toQueryString(params)}`,
    );
  },
};
