import { apiRequest } from '../client';

export type ConceptVideoData = {
  _id?: string;
  title: string;
  subtitle: string;
  /**
   * The URL used for video playback.
   * For S3 videos: this is the short-lived GET signed URL returned as `playbackUrl`
   * by the backend (falls back to `videoUrl` if `playbackUrl` is absent).
   * For YouTube: this is the YouTube watch/embed URL unchanged.
   */
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

      // Prefer `playbackUrl` (signed GET URL for S3) over `videoUrl` (permanent URL).
      // `playbackUrl` is set by the backend when the video is a private S3 object.
      // For YouTube videos the backend sets playbackUrl === videoUrl so either works.
      const effectiveVideoUrl: string =
        payload.playbackUrl ||
        payload.videoUrl ||
        payload.url ||
        payload.video ||
        '';

      const mapped: ConceptVideoData = {
        _id: payload._id,
        title: payload.title || '',
        subtitle: payload.subtitle || '',
        videoUrl: effectiveVideoUrl,
        youtubeId: payload.youtubeId || '',
        thumbnailUrl: payload.thumbnailUrl || '',
        isActive: payload.isActive ?? true,
      };
      console.log('[CONCEPT VIDEO MAPPED DATA]', {
        ...mapped,
        // Do not log full signed URL — it contains sensitive query params.
        videoUrl: mapped.videoUrl
          ? `[URL length: ${mapped.videoUrl.length}]`
          : '[empty]',
      });
      return mapped;
    } catch (err: any) {
      console.log('[CONCEPT VIDEO LOCAL API ERROR, TRYING PROD FALLBACK]', err?.message || err);
      try {
        const prodRes = await fetch('https://appadmin.paryavaranprahri.com/api/v1/concept-video');
        const json = await prodRes.json();
        const payload = json?.data || json;
        if (payload) {
          // Same playbackUrl-first mapping for prod fallback.
          const effectiveVideoUrl: string =
            payload.playbackUrl ||
            payload.videoUrl ||
            payload.url ||
            payload.video ||
            '';

          const mapped: ConceptVideoData = {
            _id: payload._id,
            title: payload.title || '',
            subtitle: payload.subtitle || '',
            videoUrl: effectiveVideoUrl,
            youtubeId: payload.youtubeId || '',
            thumbnailUrl: payload.thumbnailUrl || '',
            isActive: payload.isActive ?? true,
          };
          console.log('[CONCEPT VIDEO PROD FALLBACK DATA]', {
            ...mapped,
            videoUrl: mapped.videoUrl
              ? `[URL length: ${mapped.videoUrl.length}]`
              : '[empty]',
          });
          return mapped;
        }
      } catch (fallbackErr: any) {
        console.log('[CONCEPT VIDEO PROD FALLBACK ERROR]', fallbackErr?.message || fallbackErr);
      }
      return null;
    }
  },
};
