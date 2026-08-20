import {
  ApiError,
  getMitraFlag,
  getStoredUser,
  mitrasService,
  setMitraFlag,
} from '../api';

const MITRA_ROLES = new Set(['field_officer', 'plantation_partner']);

export type MitraAccess = 'none' | 'pending' | 'approved';

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

/**
 * After OTP / app open: only Approved Mitra (or staff) gets Mitra dashboard.
 * Pending waits for admin confirmation.
 */
export async function resolveMitraAccess(): Promise<MitraAccess> {
  const user = await getStoredUser();
  const role = String(user?.role || '').toLowerCase();
  if (MITRA_ROLES.has(role)) {
    await setMitraFlag(true);
    return 'approved';
  }

  try {
    const mitra = await mitrasService.getMe();
    if (!mitra?.mitraId) {
      await setMitraFlag(false);
      return 'none';
    }
    const status = normalizeStatus(String(mitra.status || ''));
    if (status === 'pending') {
      await setMitraFlag(false, mitra.mitraId);
      return 'pending';
    }
    if (status === 'approved' || !status) {
      await setMitraFlag(true, mitra.mitraId);
      return 'approved';
    }
    await setMitraFlag(false);
    return 'none';
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      await setMitraFlag(false);
      return 'none';
    }
    const cached = await getMitraFlag();
    return cached ? 'approved' : 'none';
  }
}

/** True only when Mitra dashboard is allowed. */
export async function resolveIsMitra(): Promise<boolean> {
  const access = await resolveMitraAccess();
  return access === 'approved';
}
