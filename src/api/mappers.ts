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

export function formatDateNice(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
    status: api.policyStatus || 'Active',
    iconUrl: iconForVehicle(api.name, api.fuel),
    policyNumber: api.policyNumber,
    policyStatus: api.policyStatus,
    policyStartDate: api.policyStartDate,
    policyEndDate: api.policyEndDate,
    validFromFormatted: formatDateNice(api.policyStartDate),
    validUntilFormatted: formatDateNice(api.policyEndDate),
    vehicleType: api.vehicleType,
    city: api.city,
    state: api.state,
    isInsuranceVehicle: api.isInsuranceVehicle ?? api._id.startsWith('insurance-'),
  };
}

/** Normalize ShieldSure / insurance API vehicle payloads into ApiVehicle. */
export function normalizeInsuranceVehicle(
  raw: Record<string, unknown>,
  index: number,
): ApiVehicle | null {
  const vehObj = (
    raw.vehicle && typeof raw.vehicle === 'object' ? raw.vehicle : {}
  ) as Record<string, unknown>;
  const insObj = (
    raw.insurance && typeof raw.insurance === 'object' ? raw.insurance : {}
  ) as Record<string, unknown>;
  const locObj = (
    raw.location && typeof raw.location === 'object' ? raw.location : {}
  ) as Record<string, unknown>;

  const plate = String(
    raw.registrationNumber ??
      vehObj.registrationNumber ??
      raw.plate ??
      raw.regNo ??
      raw.vehicleNumber ??
      '',
  ).trim();
  if (!plate) return null;

  const name = String(
    raw.vehicleModel ??
      vehObj.vehicleModel ??
      raw.name ??
      raw.model ??
      'Insured Vehicle',
  ).trim();

  const vhId = String(
    raw.vhId ??
      vehObj.vehicleId ??
      insObj.policyNumber ??
      raw.policyNumber ??
      `INS-${index + 1}`,
  );

  const fuel = String(
    raw.fuel ?? raw.fuelType ?? vehObj.vehicleType ?? 'Diesel',
  );

  const vehicleType = String(
    raw.vehicleType ?? vehObj.vehicleType ?? 'SUV',
  ).trim();

  const policyNumber = String(
    raw.policyNumber ?? insObj.policyNumber ?? '',
  ).trim();

  const policyStatus = String(
    raw.policyStatus ?? insObj.status ?? 'ACTIVE',
  ).trim();

  const policyStartDate = String(
    raw.policyStartDate ?? insObj.startDate ?? '',
  ).trim();

  const policyEndDate = String(
    raw.policyEndDate ?? insObj.endDate ?? '',
  ).trim();

  const city = String(locObj.city ?? raw.city ?? '').trim();
  const state = String(locObj.state ?? raw.state ?? '').trim();

  return {
    _id: String(raw._id ?? insObj.insuranceId ?? `insurance-${plate}-${index}`),
    plate,
    name,
    vhId,
    fuel,
    insuranceId: insObj.insuranceId ? String(insObj.insuranceId) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    policyNumber: policyNumber || undefined,
    policyStatus: policyStatus || 'ACTIVE',
    policyStartDate: policyStartDate || undefined,
    policyEndDate: policyEndDate || undefined,
    vehicleType: vehicleType || undefined,
    city: city || undefined,
    state: state || undefined,
    isInsuranceVehicle: true,
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
