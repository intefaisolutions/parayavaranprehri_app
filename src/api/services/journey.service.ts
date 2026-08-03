import { apiRequest } from '../client';

export type JourneyAchievementApi = {
  _id: string;
  year: string;
  type: 'recognition' | 'award' | 'record' | 'doctorate' | 'international';
  title: string;
  subtitle: string;
  imageUrl?: string;
  displayOrder?: number;
};

export type JourneyProfileApi = {
  _id?: string;
  name: string;
  subtitle?: string;
  photo?: string;
  stats?: { value: string; label: string }[];
  tags?: string[];
  inspirationText?: string;
};

export type JourneyTimeline = {
  profile: JourneyProfileApi;
  achievements: JourneyAchievementApi[];
};

export const journeyService = {
  getTimeline() {
    return apiRequest<JourneyTimeline>('/journey', { auth: false });
  },
};
