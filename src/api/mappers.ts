import type { ApiVehicle } from '../api/types';
import type { Vehicle } from '../data/vehiclesData';

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

export function mapApiVehicleToUi(api: ApiVehicle): Vehicle {
  return {
    id: api._id,
    name: api.name,
    plate: api.plate,
    vhId: api.vhId,
    fuel: api.fuel,
    regDate: formatRegDate(api.createdAt),
    trees: 3,
    co2: 45,
    survival: '100%',
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
    .map(mapApiVehicleToUi);
}
