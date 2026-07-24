import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from './types';

const KEYS = {
  accessToken: '@pp/accessToken',
  refreshToken: '@pp/refreshToken',
  user: '@pp/user',
  phone: '@pp/phone',
} as const;

export async function saveSession(params: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  phone?: string;
}): Promise<void> {
  await AsyncStorage.setItem(KEYS.accessToken, params.accessToken);
  await AsyncStorage.setItem(KEYS.refreshToken, params.refreshToken);
  await AsyncStorage.setItem(KEYS.user, JSON.stringify(params.user));
  if (params.phone) {
    await AsyncStorage.setItem(KEYS.phone, params.phone);
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.accessToken);
  await AsyncStorage.removeItem(KEYS.refreshToken);
  await AsyncStorage.removeItem(KEYS.user);
  await AsyncStorage.removeItem(KEYS.phone);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.refreshToken);
}

export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await AsyncStorage.setItem(KEYS.accessToken, accessToken);
  await AsyncStorage.setItem(KEYS.refreshToken, refreshToken);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getStoredPhone(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.phone);
}
