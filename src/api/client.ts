import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './storage';
import { ApiError, type ApiErrorBody, type TokenPair } from './types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await clearSession();
        return false;
      }

      const data = (await response.json()) as TokenPair;
      await setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      await clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  mobile: 'Mobile',
  email: 'Email',
  gender: 'Gender',
  address: 'Address',
  name: 'Name',
  phone: 'Phone',
  password: 'Password',
  code: 'OTP',
  root: 'Form',
};

function formatFieldErrors(
  errors: Record<string, string[] | string> | string[],
): string {
  if (Array.isArray(errors)) {
    return errors.filter(Boolean).join('\n');
  }

  return Object.entries(errors)
    .map(([field, messages]) => {
      const label = FIELD_LABELS[field] ?? field;
      const text = Array.isArray(messages)
        ? messages.join(', ')
        : String(messages);
      return `${label}: ${text}`;
    })
    .filter(Boolean)
    .join('\n');
}

function extractMessage(body: ApiErrorBody | null, fallback: string): string {
  if (!body) return fallback;

  const fromErrors =
    body.errors !== undefined ? formatFieldErrors(body.errors) : '';

  let fromMessage = '';
  if (typeof body.message === 'string' && body.message.trim()) {
    fromMessage = body.message.trim();
  } else if (Array.isArray(body.message) && body.message.length > 0) {
    fromMessage = body.message.join('\n');
  }

  // Prefer field-level details when present
  if (fromErrors) {
    if (
      fromMessage &&
      fromMessage !== 'Validation failed' &&
      !fromMessage.startsWith('Validation failed')
    ) {
      return `${fromMessage}\n${fromErrors}`;
    }
    return fromErrors;
  }

  if (fromMessage) return fromMessage;
  if (body.error) return body.error;
  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    skipRefresh = false,
  } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    } as any);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please try again.');
    }
    throw new ApiError(
      0,
      'Unable to reach the server. Check your connection and API URL.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
  }

  if (!response.ok) {
    const errorBody = (parsed as ApiErrorBody) ?? null;
    throw new ApiError(
      response.status,
      extractMessage(errorBody, `Request failed (${response.status})`),
      errorBody,
    );
  }

  // Backend TransformInterceptor wraps payloads as { success, data, meta? }
  if (
    parsed &&
    typeof parsed === 'object' &&
    'success' in parsed &&
    'data' in parsed
  ) {
    const envelope = parsed as { data: T; meta?: unknown };
    if (envelope.meta && Array.isArray(envelope.data)) {
      return { items: envelope.data, meta: envelope.meta } as T;
    }
    return envelope.data;
  }

  return parsed as T;
}

export async function apiUpload<T>(
  path: string,
  file: { uri: string; name: string; type: string },
  query: Record<string, string | undefined> = {},
  skipRefresh = false,
): Promise<T> {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const qs = toQueryString(query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${qs}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please try again.');
    }
    throw new ApiError(
      0,
      'Unable to reach the server. Check your connection and API URL.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiUpload<T>(path, file, query, true);
    }
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
  }

  if (!response.ok) {
    const errorBody = (parsed as ApiErrorBody) ?? null;
    throw new ApiError(
      response.status,
      extractMessage(errorBody, `Upload failed (${response.status})`),
      errorBody,
    );
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    'success' in parsed &&
    'data' in parsed
  ) {
    return (parsed as { data: T }).data;
  }

  return parsed as T;
}

export function toQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
