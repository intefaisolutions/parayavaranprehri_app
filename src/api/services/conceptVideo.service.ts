import { apiRequest } from '../client';

export type ConceptVideoData = {
  _id?: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  isActive?: boolean;
};

export const conceptVideoService = {
  get() {
    return apiRequest<ConceptVideoData>('/concept-video');
  },
};
