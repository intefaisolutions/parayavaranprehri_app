import type { ApiVehicle } from '../api/types';
import type { Vehicle } from '../data/vehiclesData';
import type { VehicleTreesResponse } from './services/vehicles.service';

function formatRegDate(iso?: string): string {
  if (!iso) {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function iconForVehicle(name: string, fuel: string): string {
  const lower = name.toLowerCase();
  if (fuel.toLowerCase().includes('electric') || fuel === 'EV') {
    return 'https://img.icons8.com/color/96/electric-vehicle.png';
  }
  if (lower.includes('thar') || lower.includes('van')) {
    return 'https://img.icons8.com/color/96/van.png';
  }
  return 'https://img.icons8.com/color/96/suv.png';
}

export type VehicleCardStats = {
  trees: number;
  co2: number;
  survival: string;
};

const EMPTY_STATS: VehicleCardStats = {
  trees: 0,
  co2: 0,
  survival: '—',
};

export function statsFromVehicleTrees(
  res: VehicleTreesResponse,
): VehicleCardStats {
  const list = Array.isArray(res.trees) ? res.trees : [];
  const trees = Number(res.totalTrees) || list.length;
  const co2 = Math.round(
    list.reduce((sum, t) => sum + (Number(t.co2Kg) || 0), 0),
  );
  if (trees === 0) {
    return { trees: 0, co2: 0, survival: '—' };
  }
  const alive = list.filter(t => {
    const status = String(t.status || '').toUpperCase();
    return status !== 'DEAD';
  }).length;
  return {
    trees,
    co2,
    survival: `${Math.round((alive / trees) * 100)}%`,
  };
}

export function mapApiVehicleToUi(
  api: ApiVehicle,
  stats: VehicleCardStats = EMPTY_STATS,
): Vehicle {
  return {
    id: api._id,
    name: api.name,
    plate: api.plate,
    vhId: api.vhId,
    fuel: api.fuel,
    regDate: formatRegDate(api.createdAt),
    trees: stats.trees,
    co2: stats.co2,
    survival: stats.survival,
    status: 'Active',
    iconUrl: iconForVehicle(api.name, api.fuel),
  };
}

/** Normalize ShieldSure / insurance API vehicle payloads into ApiVehicle. */
export function normalizeInsuranceVehicle(
  raw: Record<string, unknown>,
  index: number,
): ApiVehicle | null {
  const plate = String(
    raw.plate ??
      raw.registrationNumber ??
      raw.regNo ??
      raw.vehicleNumber ??
      raw.number ??
      '',
  ).trim();
  if (!plate) return null;

  const name = String(
    raw.name ??
      raw.model ??
      raw.vehicleModel ??
      raw.makeModel ??
      raw.brand ??
      'Insured Vehicle',
  ).trim();
  const vhId = String(
    raw.vhId ?? raw.vehicleId ?? raw.policyNumber ?? raw._id ?? `INS-${index + 1}`,
  );
  const fuel = String(raw.fuel ?? raw.fuelType ?? 'Petrol');

  return {
    _id: String(raw._id ?? `insurance-${plate}-${index}`),
    plate,
    name,
    vhId,
    fuel,
    insuranceId: raw.insuranceId ? String(raw.insuranceId) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

export function mapInsuranceListToUi(raw: unknown): Vehicle[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { vehicles?: unknown })?.vehicles)
      ? (raw as { vehicles: unknown[] }).vehicles
      : Array.isArray((raw as { data?: unknown })?.data)
        ? (raw as { data: unknown[] }).data
        : [];

  return list
    .map((item, index) =>
      normalizeInsuranceVehicle(
        (item && typeof item === 'object' ? item : {}) as Record<
          string,
          unknown
        >,
        index,
      ),
    )
    .filter((v): v is ApiVehicle => v !== null)
    .map(v => mapApiVehicleToUi(v, EMPTY_STATS));
}

export function canFetchVehicleTrees(vehicleId: string): boolean {
  if (!vehicleId) return false;
  if (vehicleId.startsWith('insurance-')) return false;
  // Mongo ObjectId is 24 hex chars
  return /^[a-f\d]{24}$/i.test(vehicleId);
}
