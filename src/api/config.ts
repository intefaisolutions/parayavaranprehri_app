import { Platform } from 'react-native';

/**
 * Backend on your PC — phone/APK must use the PC LAN IP (same Wi‑Fi).
 * Emulator can use 10.0.2.2 (maps to host localhost).
 *
 * Current PC IP: 192.168.1.9  (change if your Wi‑Fi IP changes)
 */
const USE_PHYSICAL_DEVICE_OR_APK = true;
const LAN_IP = '192.168.1.9';

const DEV_HOST = USE_PHYSICAL_DEVICE_OR_APK
  ? LAN_IP
  : Platform.OS === 'android'
    ? '10.0.2.2'
    : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:3000/api/v1`;

export const API_TIMEOUT_MS = 20000;
