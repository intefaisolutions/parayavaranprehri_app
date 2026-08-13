export type Vehicle = {
  id: string;
  name: string;
  plate: string;
  vhId: string;
  fuel: string;
  regDate: string;
  trees: number;
  co2: number;
  survival: string;
  status: string;
  iconUrl: string;
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'Land Rover Defender 110',
    plate: 'MP09 CX 4521',
    vhId: 'VH-IND-2026-00045',
    fuel: 'Diesel',
    regDate: '12 Aug 2024',
    trees: 3,
    co2: 58,
    survival: '100%',
    status: 'Active',
    iconUrl: 'https://img.icons8.com/color/96/suv.png',
  },
  {
    id: '2',
    name: 'Mahindra Thar',
    plate: 'MP09 KK 8810',
    vhId: 'VH-IND-2026-00088',
    fuel: 'Diesel',
    regDate: '02 Oct 2024',
    trees: 3,
    co2: 39,
    survival: '67%',
    status: 'Active',
    iconUrl: 'https://img.icons8.com/color/96/van.png',
  },
];

export type AddedVehicle = {
  id?: string;
  plate: string;
  name: string;
  vhId: string;
  fuel?: string;
};

/** Optimistic card after create — real trees/CO₂ come from reload + getTrees. */
export function createVehicleFromAdded(added: AddedVehicle): Vehicle {
  return {
    id: added.id ?? String(Date.now()),
    name: added.name,
    plate: added.plate,
    vhId: added.vhId,
    fuel: added.fuel ?? 'Diesel',
    regDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    trees: 0,
    co2: 0,
    survival: '—',
    status: 'Active',
    iconUrl: 'https://img.icons8.com/color/96/suv.png',
  };
}

export type VehicleStats = {
  vehicleCount: number;
  totalTrees: number;
  totalCo2: number;
  avgSurvival: number;
  netZeroProgress: number;
};

function parseSurvival(value: string) {
  return Number.parseInt(value.replace('%', ''), 10) || 0;
}

export function computeVehicleStats(vehicles: Vehicle[]): VehicleStats {
  if (vehicles.length === 0) {
    return {
      vehicleCount: 0,
      totalTrees: 0,
      totalCo2: 0,
      avgSurvival: 0,
      netZeroProgress: 0,
    };
  }

  const totalTrees = vehicles.reduce((sum, v) => sum + v.trees, 0);
  const totalCo2 = vehicles.reduce((sum, v) => sum + v.co2, 0);
  const avgSurvival = Math.round(
    vehicles.reduce((sum, v) => sum + parseSurvival(v.survival), 0) /
      vehicles.length,
  );

  return {
    vehicleCount: vehicles.length,
    totalTrees,
    totalCo2,
    avgSurvival,
    /** Net Zero % comes from mission-progress API — not invented here. */
    netZeroProgress: 0,
  };
}

/** Profile/dashboard stats from real vehicle list only (no MAP_TREES inflation). */
export function computeProfileStats(vehicles: Vehicle[]): VehicleStats {
  return computeVehicleStats(vehicles);
}
