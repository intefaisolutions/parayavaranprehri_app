export type AchievementType =
  | 'recognition'
  | 'award'
  | 'record'
  | 'doctorate'
  | 'international';

export type Achievement = {
  id: string;
  year: string;
  type: AchievementType;
  title: string;
  subtitle: string;
  imageUrl?: string;
  displayOrder?: number;
  updatedAt?: string;
};

export type ProfileStat = {
  value: string;
  label: string;
};
