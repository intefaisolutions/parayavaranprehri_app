import { Vehicle } from './vehiclesData';

export type TreeMonthPoint = {
  label: string;
  /** 0–100 */
  progress: number;
  photoUrl?: string;
};

export type AssignedTree = {
  id: string;
  apiId?: string;
  name: string;
  treeId: string;
  plantedDate: string;
  status: string;
  location: string;
  height: string;
  co2: string;
  /** 0–1 from analytics; null until loaded */
  progress: number | null;
  /** Real upload URL only — never a stock-photo fallback */
  imageUrl?: string;
  months: TreeMonthPoint[];
};

export type VehicleDetailInfo = {
  owner: string;
  insurance: string;
  rto: string;
  assignedTrees: AssignedTree[];
};

export function getVehicleDetailInfo(vehicle: Vehicle): VehicleDetailInfo {
  return {
    owner: '—',
    insurance: '—',
    rto: '—',
    assignedTrees: [],
  };
}
