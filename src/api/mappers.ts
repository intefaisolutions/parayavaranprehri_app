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
