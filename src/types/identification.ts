export type IdentifiedNodeType = 'ROOM' | 'OBJECT' | 'ANCHOR';

export type IdentificationStatus =
  | 'UNIDENTIFIED'
  | 'SUGGESTED'
  | 'IDENTIFIED'
  | 'NEEDS_REVIEW';

export type RevalidationStatus =
  | 'MATCHED'
  | 'NEW_NODE'
  | 'MISSING_NODE'
  | 'NEEDS_REVIEW';

export interface NodeIdentificationRecord {
  id: string;
  houseModelId: string;
  nodeName: string;
  stableId: string;
  displayName: string;
  nodeType: IdentifiedNodeType;
  category: string;
  suggestedCategory: string | null;
  status: IdentificationStatus;
  parentRoom: string | null;
  parentFloor: string | null;
  description: string | null;
  revalidationStatus: RevalidationStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface IdentificationOverviewMetrics {
  total: number;
  identified: number;
  unidentified: number;
  suggested: number;
  needsReview: number;
}

export interface IdentificationOverviewSummary {
  rooms: IdentificationOverviewMetrics;
  objects: IdentificationOverviewMetrics;
  anchors: IdentificationOverviewMetrics;
  totalNodes: number;
  overallIdentifiedCount: number;
  overallProgressPercent: number;
}

export interface UpsertIdentificationPayload {
  nodeName: string;
  displayName?: string;
  category: string;
  description?: string;
  status?: IdentificationStatus;
}

export interface BulkPreviewItem {
  id: string;
  nodeName: string;
  nodeType: IdentifiedNodeType;
  currentCategory: string;
  newCategory: string;
  currentDisplayName: string;
  newDisplayName: string;
  currentStatus: IdentificationStatus;
  newStatus: IdentificationStatus;
  parentRoom: string | null;
  parentFloor: string | null;
  isValid: boolean;
}

export interface BulkPreviewResponse {
  preview: boolean;
  totalCandidates: number;
  validCount: number;
  items: BulkPreviewItem[];
}

export interface BulkConfirmPayload {
  items?: Array<{
    nodeName: string;
    displayName?: string;
    category?: string;
    status?: IdentificationStatus;
  }>;
  filterNodeType?: IdentifiedNodeType;
  filterFloor?: string;
  filterRoom?: string;
  previewOnly?: boolean;
}

export interface RevalidationReport {
  summary: {
    totalMatched: number;
    totalNew: number;
    totalMissing: number;
    totalNeedsReview: number;
  };
  details: {
    matched: string[];
    newNodes: string[];
    missingNodes: string[];
    needsReview: Array<{ nodeName: string; reason: string }>;
  };
}

