/**
 * PHASE 6: COMMERCIAL SERVICE PACKAGE TYPES
 */

export type PackageStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ServiceInclusionCategory =
  | 'PROPERTY_SURVEY'
  | 'FLOOR_PLAN_2D'
  | 'IOT_DEVICE_CONFIGURATION'
  | 'IOT_DEVICE_INSTALLATION'
  | 'AUTOMATION_CONFIGURATION'
  | 'SMART_HOME_DASHBOARD'
  | 'THREE_D_MODEL'
  | 'GLB_ASSET_PREPARATION'
  | 'TRAINING_AND_HANDOVER'
  | 'OTHER';

export interface ServicePackageInclusion {
  id?: string;
  packageId?: string;
  category: ServiceInclusionCategory;
  displayName: string;
  description?: string | null;
  isIncluded: boolean;
  quantity?: number | null;
  metadata?: any;
  displayOrder: number;
}

export interface ServicePackage {
  id: string;
  name: string;
  code: string;
  shortDescription: string;
  description: string;
  price: string;
  formattedPrice?: string;
  currency: string;
  estimatedDuration?: string | null;
  status: PackageStatus;
  displayOrder: number;
  imageUrl?: string | null;
  maxRooms?: number | null;
  maxDevices?: number | null;
  includedAutomations?: number | null;
  hasPhysicalIot: boolean;
  hasThreeD: boolean;
  createdAt: string;
  updatedAt: string;
  inclusions?: ServicePackageInclusion[];
}

export interface CreatePackagePayload {
  name: string;
  code: string;
  shortDescription: string;
  description: string;
  price: string | number;
  currency?: string;
  estimatedDuration?: string | null;
  status?: PackageStatus;
  displayOrder?: number;
  imageUrl?: string | null;
  maxRooms?: number | null;
  maxDevices?: number | null;
  includedAutomations?: number | null;
  hasPhysicalIot?: boolean;
  hasThreeD?: boolean;
  inclusions?: Omit<ServicePackageInclusion, 'id' | 'packageId'>[];
}

export interface UpdatePackagePayload {
  name?: string;
  code?: string;
  shortDescription?: string;
  description?: string;
  price?: string | number;
  currency?: string;
  estimatedDuration?: string | null;
  displayOrder?: number;
  imageUrl?: string | null;
  maxRooms?: number | null;
  maxDevices?: number | null;
  includedAutomations?: number | null;
  hasPhysicalIot?: boolean;
  hasThreeD?: boolean;
  inclusions?: Omit<ServicePackageInclusion, 'id' | 'packageId'>[];
}
