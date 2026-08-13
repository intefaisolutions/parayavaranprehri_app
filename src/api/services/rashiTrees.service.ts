import { apiRequest, toQueryString } from '../client';

export type PublicRashiTree = {
  rashi: string;
  rashiHindi?: string;
  zodiacNumber?: number;
  tree: string;
  scientificName?: string;
  localName?: string;
  description?: string;
  benefits?: string[];
  careInstructions?: string;
  image?: string;
  galleryImages?: string[];
  deity?: string;
  nakshatras?: string[];
  karmaBonus?: number;
  vitalityBonus?: number;
  harmonyBonus?: number;
  trees?: Array<{
    tree: string;
    scientificName?: string;
    localName?: string;
    description?: string;
    benefits?: string[];
    deity?: string;
    nakshatras?: string[];
    karmaBonus?: number;
    vitalityBonus?: number;
    harmonyBonus?: number;
    image?: string;
  }>;
};

export const rashiTreesService = {
  byDob(dob: string) {
    return apiRequest<PublicRashiTree>(
      `/rashi-trees/by-dob${toQueryString({ dob })}`,
      { auth: false },
    );
  },

  byRashi(rashi: string) {
    return apiRequest<PublicRashiTree>(
      `/rashi-trees/by-rashi/${encodeURIComponent(rashi)}`,
      { auth: false },
    );
  },

  list(params: { page?: number; limit?: number; search?: string } = {}) {
    return apiRequest(`/rashi-trees${toQueryString(params)}`);
  },
};
