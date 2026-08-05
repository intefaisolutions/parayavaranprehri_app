import { Vehicle } from './vehiclesData';

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
  progress: number;
  imageUrl: string;
  months: string[];
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
