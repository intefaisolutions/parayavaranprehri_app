/**
 * API base URL for the mobile app.
 *
 * Local backend via USB / ADB Reverse (works on physical phone & emulator):
 *   http://localhost:3000/api/v1  (Requires: adb reverse tcp:3000 tcp:3000)
 * LAN IP fallback:
 *   http://192.168.1.19:3000/api/v1
 * Live production:
 *   https://appadmin.paryavaranprahri.com/api/v1
 */
export const API_BASE_URL = 'http://localhost:3000/api/v1';

export const API_TIMEOUT_MS = 20000;
