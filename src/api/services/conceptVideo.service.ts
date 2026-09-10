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
  async get(): Promise<ConceptVideoData | null> {
    try {
      const res = await apiRequest<any>('/concept-video');
      console.log('[CONCEPT VIDEO API DATA]', res);
      const payload = res && typeof res === 'object' && 'data' in res && res.data ? res.data : res;
      if (!payload || typeof payload !== 'object') return null;

      const mapped: ConceptVideoData = {
        _id: payload._id,
        title: payload.title || '',
        subtitle: payload.subtitle || '',
        videoUrl: payload.videoUrl || payload.url || payload.video || '',
        youtubeId: payload.youtubeId || '',
        thumbnailUrl: payload.thumbnailUrl || '',
        isActive: payload.isActive ?? true,
      };
      console.log('[CONCEPT VIDEO MAPPED DATA]', mapped);
      return mapped;
    } catch (err: any) {
      console.log('[CONCEPT VIDEO LOCAL API ERROR, TRYING PROD FALLBACK]', err?.message || err);
      try {
        const prodRes = await fetch('https://appadmin.paryavaranprahri.com/api/v1/concept-video');
        const json = await prodRes.json();
        const payload = json?.data || json;
        if (payload) {
          const mapped: ConceptVideoData = {
            _id: payload._id,
            title: payload.title || '',
            subtitle: payload.subtitle || '',
            videoUrl: payload.videoUrl || payload.url || payload.video || '',
            youtubeId: payload.youtubeId || '',
            thumbnailUrl: payload.thumbnailUrl || '',
            isActive: payload.isActive ?? true,
          };
          console.log('[CONCEPT VIDEO PROD FALLBACK DATA]', mapped);
          return mapped;
        }
      } catch (fallbackErr: any) {
        console.log('[CONCEPT VIDEO PROD FALLBACK ERROR]', fallbackErr?.message || fallbackErr);
      }
      return null;
    }
  },
};
