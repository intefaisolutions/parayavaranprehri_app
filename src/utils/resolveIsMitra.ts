import {
  getMitraFlag,
  getStoredUser,
  mitrasService,
  setMitraFlag,
} from '../api';

const MITRA_ROLES = new Set([
  'field_officer',
  'plantation_partner',
]);

const ACTIVE_MITRA_STATUSES = new Set(['Pending', 'Approved', 'pending', 'approved']);

/**
 * Decide whether the logged-in user should see Mitra home.
 * 1) Staff roles (field_officer / plantation_partner)
 * 2) Mitra profile via GET /mitras/me (Pending or Approved)
 * 3) Cached flag as last-known (until API confirms)
 */
export async function resolveIsMitra(): Promise<boolean> {
  const user = await getStoredUser();
  const role = String(user?.role || '').toLowerCase();
  if (MITRA_ROLES.has(role)) {
    await setMitraFlag(true);
    return true;
  }

  try {
    const mitra = await mitrasService.getMe();
    const status = String(mitra?.status || '');
    const ok =
      Boolean(mitra?.mitraId) &&
      (ACTIVE_MITRA_STATUSES.has(status) || !status);
    await setMitraFlag(ok, mitra?.mitraId || null);
    return ok;
  } catch {
    // API fail / no profile — fall back to cached flag from prior register
    return getMitraFlag();
  }
}
