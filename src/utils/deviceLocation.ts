import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export type DeviceCoords = { latitude: number; longitude: number };

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const fine = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'Allow location to detect your Vidhan Sabha',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return fine === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCurrentCoords(
  timeoutMs = 15000,
): Promise<DeviceCoords | null> {
  const ok = await ensureLocationPermission();
  if (!ok) return null;

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
