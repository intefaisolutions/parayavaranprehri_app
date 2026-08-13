import { uploadsService } from '../services/uploads.service';

/** Private S3 object URLs need a temporary signed GET to display in Image. */
export function isPrivateS3Url(url?: string | null): boolean {
  if (!url) return false;
  if (/[?&]X-Amz-/i.test(url)) return false;
  return /amazonaws\.com|\.s3[.-]/i.test(url);
}

/**
 * Resolve a media URL for React Native Image.
 * - Admin uploads store permanent S3 URLs in Mongo (`leader.photo`, etc.).
 * - Backend leaders list usually already returns a signed `photo`.
 * - This helper re-signs if a raw S3 URL somehow reaches the app.
 */
export async function resolveMediaUrl(
  url?: string | null,
): Promise<string | undefined> {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  if (!isPrivateS3Url(raw)) return raw;
  try {
    const res = await uploadsService.signed({ url: raw });
    return res?.signedUrl || raw;
  } catch {
    return raw;
  }
}

export async function resolveMediaUrls(
  urls: Array<string | null | undefined>,
): Promise<Array<string | undefined>> {
  return Promise.all(urls.map(u => resolveMediaUrl(u)));
}
