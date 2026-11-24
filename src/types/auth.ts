export type UserRole = 'SUPER_ADMIN' | 'TECHNICIAN' | 'CUSTOMER';

export type TechnicianAvailabilityStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'ON_LEAVE'
  | 'INACTIVE';

export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  billingAddress: string | null;
  companyName: string | null;
  notes: string | null;
}

export interface TechnicianProfile {
  id: string;
  userId: string;
  employeeCode: string | null;
  specialization: string | null;
  serviceArea: string | null;
  availabilityStatus: TechnicianAvailabilityStatus;
}

export interface AuthUser {
  id: string;
  username: string | null;
  email: string | null;
  name: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  customerProfile?: CustomerProfile | null;
  technicianProfile?: TechnicianProfile | null;
  ownedHouseIds?: string[];
  /**
   * Backward-compatibility convenience field: populated only when a Customer
   * owns exactly 1 property via House.customerId.
   */
  houseId: string | null;
  houseName?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
