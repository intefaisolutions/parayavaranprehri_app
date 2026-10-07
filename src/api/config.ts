/**
 * API Base URL for Paryavaran Prahri App
 *
 * ── 🚀 Production (deployed server):
 *      https://appadmin.paryavaranprahri.com/api/v1
 *
 * ── 📱 Real Android Device (same Wi-Fi as this PC):
 *      http://192.168.1.19:3000/api/v1
 *
 * ── 💻 Android Emulator (AVD):
 *      http://10.0.2.2:3000/api/v1
 */

// 📱 Local Backend — via USB adb reverse / localhost:3000
export const API_BASE_URL = 'http://localhost:3000/api/v1';

// 📱 Local Backend — via Wi-Fi IP (PC & Phone on same Wi-Fi)
// export const API_BASE_URL = 'http://10.228.245.40:3000/api/v1';

// 💻 Local — Android Emulator (AVD)
// export const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';

// 🚀 PRODUCTION — Live server
// export const API_BASE_URL = 'https://appadmin.paryavaranprahri.com/api/v1';

export const API_TIMEOUT_MS = 20000;
