import { getMapTreeCount, MAP_TREES } from './mapTreesData';

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

const INITIAL_VEHICLE_TREES = INITIAL_VEHICLES.reduce(
  (sum, vehicle) => sum + vehicle.trees,
  0,
);

export type AddedVehicle = {
  id?: string;
  plate: string;
  name: string;
  vhId: string;
  fuel?: string;
};

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
    trees: 3,
    co2: 45,
    survival: '100%',
    status: 'Active',
    iconUrl: 'https://img.icons8.com/color/96/suv.png',
  };
}

export function generateVehicleId() {
  return `VH-IND-2026-${String(Math.floor(Math.random() * 900000)).padStart(6, '0')}`;
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
  const netZeroProgress = Math.min(
    100,
    Math.round(totalCo2 / 8 + totalTrees * 2),
  );

  return {
    vehicleCount: vehicles.length,
    totalTrees,
    totalCo2,
    avgSurvival,
    netZeroProgress,
  };
}

/** Profile/dashboard stats: map plantations + newly added vehicle trees */
export function computeProfileStats(vehicles: Vehicle[]): VehicleStats {
  const vehicleStats = computeVehicleStats(vehicles);
  const extraVehicleTrees = Math.max(
    0,
    vehicleStats.totalTrees - INITIAL_VEHICLE_TREES,
  );

  return {
    ...vehicleStats,
    totalTrees: getMapTreeCount(MAP_TREES) + extraVehicleTrees,
    netZeroProgress: Math.min(
      100,
      Math.round(
        vehicleStats.totalCo2 / 8 +
          (getMapTreeCount(MAP_TREES) + extraVehicleTrees) * 2,
      ),
    ),
  };
}
