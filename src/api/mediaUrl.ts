import { uploadsService } from './services/uploads.service';

export function toPermanentMediaUrl(url: string): string {
  if (!url) return url;
  if (/amazonaws\.com|\.s3[.-]/i.test(url) || /[?&]X-Amz-/i.test(url)) {
    return url.split('?')[0];
  }
  return url;
}

export function isS3MediaUrl(url?: string | null): boolean {
  if (!url) return false;
  return /amazonaws\.com|\.s3[.-]/i.test(url) || /[?&]X-Amz-/i.test(url);
}

/** Private S3 object URLs need a temporary signed GET to display in Image. */
export function isPrivateS3Url(url?: string | null): boolean {
  if (!url) return false;
  if (/[?&]X-Amz-/i.test(url)) return false;
  return /amazonaws\.com|\.s3[.-]/i.test(url);
}

export function withCacheBust(
  url: string,
  version?: string | number | null,
): string {
  const permanent = toPermanentMediaUrl(url);
  if (!version || !isS3MediaUrl(permanent)) return permanent;
  const v = encodeURIComponent(String(version));
  return `${permanent}${permanent.includes('?') ? '&' : '?'}v=${v}`;
}

/**
 * Resolve a media URL for React Native Image.
 * Prefer the permanent S3 object URL (same as Admin). Append updatedAt so
 * Android does not keep showing a cached previous photo.
 */
export async function resolveMediaUrl(
  url?: string | null,
  version?: string | number | null,
): Promise<string | undefined> {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  return withCacheBust(raw, version);
}

export async function resolveMediaUrls(
  urls: Array<string | null | undefined>,
): Promise<Array<string | undefined>> {
  return Promise.all(urls.map(u => resolveMediaUrl(u)));
}

export async function signMediaUrl(
  url?: string | null,
): Promise<string | undefined> {
  const raw = String(url || '').trim();
  if (!raw || !isS3MediaUrl(raw)) return raw || undefined;
  const permanent = toPermanentMediaUrl(raw);
  try {
    const res = await uploadsService.signed({ url: permanent });
    return res?.signedUrl || permanent;
  } catch {
    return permanent;
  }
}
