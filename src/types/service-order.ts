/**
 * PHASE 7: COMMERCIAL SERVICE ORDER TYPES
 */

export type ServiceOrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export type PropertyType =
  | 'HOUSE'
  | 'APARTMENT'
  | 'VILLA'
  | 'OFFICE'
  | 'SHOPHOUSE'
  | 'OTHER';

export interface PackageInclusionSnapshot {
  id: string;
  category?: string;
  displayName: string;
  description?: string | null;
  isIncluded?: boolean;
  quantity?: number | null;
  displayOrder?: number;
}

export interface PackageSnapshot {
  packageId: string;
  packageName: string;
  packageCode: string;
  price: string;
  currency: string;
  shortDescription?: string;
  description?: string;
  estimatedDuration?: string | null;
  maxRooms?: number | null;
  maxDevices?: number | null;
  includedAutomations?: number | null;
  hasPhysicalIot?: boolean;
  hasThreeD?: boolean;
  inclusions: PackageInclusionSnapshot[];
  capturedAt: string;
}

export interface ServiceOrderStatusHistoryItem {
  id: string;
  previousStatus: ServiceOrderStatus | null;
  newStatus: ServiceOrderStatus;
  actorRole: string;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  actorUser?: {
    id: string;
    username: string | null;
    email: string | null;
    role: string;
  } | null;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  servicePackageId: string | null;
  packageSnapshot: PackageSnapshot;
  packageName: string;
  packageCode: string;
  packagePrice: string | number;
  currency: string;
  contactName?: string | null;
  contactPhone?: string | null;
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: string;
  city?: string | null;
  postalCode?: string | null;
  approximateAreaM2?: string | number | null;
  estimatedRooms?: number | null;
  hasPhysicalIot: boolean;
  customerNotes?: string | null;
  houseId?: string | null;
  status: ServiceOrderStatus;
  confirmedAt?: string | null;
  confirmedByAdminId?: string | null;
  confirmedByAdmin?: {
    id: string;
    username: string | null;
    email: string | null;
  } | null;
  rejectedAt?: string | null;
  rejectedByAdminId?: string | null;
  rejectedByAdmin?: {
    id: string;
    username: string | null;
    email: string | null;
  } | null;
  rejectionReason?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: ServiceOrderStatusHistoryItem[];
  customer?: {
    id: string;
    fullName: string;
    phone?: string | null;
    user?: {
      id: string;
      email: string | null;
      username: string | null;
      role?: string;
    } | null;
  };
  house?: {
    id: string;
    name: string;
    address: string;
    city?: string | null;
    setupStatus: string;
  } | null;
  assignedTechnician?: {
    assignmentId?: string;
    technicianProfileId?: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    employeeCode?: string | null;
    specialization?: string | null;
    serviceArea?: string | null;
    assignedAt: string;
    technicianInstructions?: string | null;
    assignedBy?: { name: string; username: string | null } | null;
  } | null;
  assignments?: ServiceOrderAssignmentItem[];
}

export interface SubmitOrderPayload {
  packageId: string;
  propertyName: string;
  propertyType?: PropertyType;
  propertyAddress: string;
  city?: string | null;
  postalCode?: string | null;
  approximateAreaM2?: number | string | null;
  estimatedRooms?: number | null;
  customerNotes?: string | null;
  contactName: string;
  contactPhone: string;
  houseId?: string | null;
}

export interface CancelOrderPayload {
  cancellationReason?: string;
}

export interface AdminConfirmOrderPayload {
  adminNotes?: string;
}

export interface AdminRejectOrderPayload {
  rejectionReason: string;
  adminNotes?: string;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedOrdersResponse {
  items: ServiceOrder[];
  pagination: OrderPagination;
}

// =============================================================================
// PHASE 8: TECHNICIAN ASSIGNMENT & AVAILABILITY TYPES
// =============================================================================

export type TechnicianAvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'ON_LEAVE' | 'INACTIVE';
export type AssignmentStatus = 'ACTIVE' | 'REVOKED';

export interface TechnicianSummaryDTO {
  technicianProfileId: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  employeeCode: string | null;
  specialization: string | null;
  serviceArea: string | null;
  availabilityStatus: TechnicianAvailabilityStatus;
  isActive: boolean;
  activeAssignmentCount: number;
  isEligibleForAssignment: boolean;
}

export interface ServiceOrderAssignmentItem {
  id: string;
  status: AssignmentStatus;
  assignedAt: string;
  revokedAt?: string | null;
  reassignmentReason?: string | null;
  technicianInstructions?: string | null;
  technician: {
    technicianProfileId: string;
    name: string;
    employeeCode: string | null;
    specialization: string | null;
    serviceArea: string | null;
  };
  assignedBy: {
    name: string;
    username: string | null;
  };
  revokedBy?: {
    name: string;
    username: string | null;
  } | null;
}

export interface AssignTechnicianPayload {
  technicianProfileId: string;
  technicianInstructions?: string | null;
}

export interface ReassignTechnicianPayload {
  technicianProfileId: string;
  reason: string;
  technicianInstructions?: string | null;
}

export interface TechnicianWorkAssignment {
  assignmentId: string;
  status: AssignmentStatus;
  assignedAt: string;
  technicianInstructions?: string | null;
  serviceOrder: {
    id: string;
    orderNumber: string;
    customerName: string;
    contactName?: string | null;
    contactPhone?: string | null;
    propertyName: string;
    propertyType: PropertyType;
    propertyAddress: string;
    city?: string | null;
    postalCode?: string | null;
    approximateAreaM2?: number | null;
    estimatedRooms?: number | null;
    customerNotes?: string | null;
    packageName: string;
    packageCode: string;
    packageSnapshot?: PackageSnapshot;
    confirmedAt?: string | null;
    houseId?: string | null;
    house?: {
      id: string;
      name: string;
      setupStatus: string;
    } | null;
    fieldSurvey?: {
      id: string;
      status: string;
    } | null;
  };
}
