export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  phone?: string;
  district?: string;
  state?: string;
  vidhanSabha?: string;
  avatar?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type AuthResponse = TokenPair & {
  user: AuthUser;
};

export type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  errors?: Record<string, string[] | string> | string[];
  success?: boolean;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type CreateVehiclePayload = {
  plate: string;
  name: string;
  /** Optional — backend allocates VH-IND-{year}-{hex} when omitted. */
  vhId?: string;
  fuel: string;
  insuranceId?: string;
};

export type ApiVehicle = {
  _id: string;
  plate: string;
  name: string;
  vhId: string;
  fuel: string;
  insuranceId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateLandOfferPayload = {
  fullName: string;
  mobile: string;
  address: string;
  landmark?: string;
  availableArea: string;
  landSize: string;
};

export type CreateGreenSelfiePayload = {
  category: string;
  imageUrl: string;
};

export type GreenSelfieListItem = {
  _id: string;
  category: string;
  imageUrl: string;
  createdAt?: string;
};

export type CreateMitraPayload = {
  name: string;
  mobile: string;
  email?: string;
  profession?: string;
  address?: string;
  membership?: 'free' | 'premium';
  status?: 'Pending' | 'Approved' | 'Cancelled';
  treesPlanted?: number;
  badges?: string[];
  remarks?: string;
  vidhanSabha?: string;
  assignedZone?: string;
  district?: string;
  state?: string;
};

export type ApiTree = {
  _id: string;
  treeId?: string;
  treeName: string;
  species?: string;
  scientificName?: string;
  userId: string;
  userName: string;
  mobile: string;
  vehicleNumber?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  location?: string;
  city?: string;
  district?: string;
  state?: string;
  image?: string;
};

export type StaticNewsItem = {
  id: number;
  title: string;
  date: string;
  content: string;
  image: string;
};

export type StaticRashiItem = {
  rashi: string;
  tree: string;
  benefits: string;
};

export type StaticMitraCard = {
  name: string;
  role: string;
  id: string;
  joinedDate: string;
  treesPlanted: number;
  badges: string[];
};

export type StaticInitiativeInfo = {
  about: {
    title: string;
    description: string;
    vision: string;
    mission: string;
  };
  support: {
    email: string;
    phone: string;
    whatsapp?: string;
    address: string;
    faq: Array<{ question: string; answer: string }>;
    prahri?: {
      email?: string;
      phone?: string;
      whatsapp?: string;
      faq?: Array<{ question: string; answer: string }>;
    };
    mitra?: {
      email?: string;
      phone?: string;
      whatsapp?: string;
      faq?: Array<{ question: string; answer: string }>;
    };
  };
};
