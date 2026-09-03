/**
 * API base URL for the mobile app.
 *
 * Live production (APK):
 *   https://appadmin.paryavaranprahri.com/api/v1
 * Local backend (PC LAN IP — phone/APK must be on same Wi‑Fi):
 *   http://192.168.1.41:3000/api/v1
 * Android emulator:
 *   http://10.0.2.2:3000/api/v1
 *
 * Paths in services are relative (e.g. `/auth/login` → full `/api/v1/auth/login`).
 */
export const API_BASE_URL = 'https://appadmin.paryavaranprahri.com/api/v1';

export const API_TIMEOUT_MS = 20000;
