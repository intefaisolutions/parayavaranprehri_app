import { Platform } from 'react-native';

/**
 * Android emulator → host machine via 10.0.2.2
 * iOS simulator → localhost
 * Physical device → set your machine LAN IP below
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:3000/api/v1`;

export const API_TIMEOUT_MS = 20000;
