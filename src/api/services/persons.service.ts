import { apiRequest, toQueryString } from '../client';

export type PersonPayload = {
  name: string;
  mobile: string;
  email?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  photo?: string;
};

export type Person = {
  _id: string;
  personId: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  vehiclesLinked?: number;
  treesAssigned?: number;
  status?: string;
  registrationDate?: string;
};

export type PersonIdentity = {
  _id: string;
  identityId: string;
  person?: string;
  personName: string;
  personMobile?: string;
  photo?: string;
  qrCode?: string;
  vehicleStickerStatus?: string;
  generatedDate?: string;
  status?: string;
};

export type PersonMe = Person & {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  vidhanSabha?: string | null;
  linkedVehicles?: number;
  treesAssigned?: number;
  co2OffsetKg?: number;
  joinedAt?: string | Date | null;
};

export type PersonStats = {
  personId: string;
  name: string;
  mobile: string;
  address: string | null;
  vidhanSabha: string | null;
  linkedVehicles: number;
  treesAssigned: number;
  co2OffsetKg: number;
  joinedAt: string | Date | null;
};

export const personsService = {
  selfRegister(payload: PersonPayload) {
    return apiRequest<Person>('/persons/self-register', {
      method: 'POST',
      body: payload,
    });
  },

  getMe() {
    return apiRequest<PersonMe>('/persons/me');
  },

  getMyStats() {
    return apiRequest<PersonStats>('/persons/me/stats');
  },

  getById(id: string) {
    return apiRequest<Person>(`/persons/${id}`);
  },

  list(params: { page?: number; limit?: number; search?: string } = {}) {
    return apiRequest(`/persons${toQueryString(params)}`);
  },
};

export const personIdentityService = {
  list(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {},
  ) {
    return apiRequest<
      PersonIdentity[] | { items: PersonIdentity[]; meta: unknown }
    >(`/person-identity${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest<PersonIdentity>(`/person-identity/${id}`);
  },
};
