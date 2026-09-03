export type NewsTag =
  | 'Mission 2047'
  | 'Plantation'
  | 'Government'
  | 'Environment'
  | 'Media';

export type NewsItem = {
  id: string;
  icon: string;
  tag: NewsTag;
  timeAgo: string;
  title: string;
  description: string;
  url?: string;
};

export const TAG_STYLES: Record<NewsTag, { bg: string; text: string }> = {
  'Mission 2047': { bg: '#fff3e0', text: '#e65100' },
  Plantation: { bg: '#e8f5e9', text: '#2e7d32' },
  Government: { bg: '#e3f2fd', text: '#1565c0' },
  Environment: { bg: '#e8f5e9', text: '#1b5e20' },
  Media: { bg: '#fff3e0', text: '#bf360c' },
};
