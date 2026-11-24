import React from 'react';
import {
  Grid2X2,
  Box,
  Target,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { IdentificationOverviewSummary } from '../../types/identification';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface IdentificationOverviewProps {
  overview: IdentificationOverviewSummary | null;
  isLoading?: boolean;
  onOpenBulkModal: () => void;
  onOpenRevalidationModal: () => void;
}

export const IdentificationOverview: React.FC<IdentificationOverviewProps> = ({
  overview,
  isLoading = false,
  onOpenBulkModal,
  onOpenRevalidationModal,
}) => {
  if (isLoading || !overview) {
    return (
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded-md mb-3" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-slate-100 rounded-2xl" />
          <div className="h-16 bg-slate-100 rounded-2xl" />
          <div className="h-16 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { rooms, objects, anchors, overallProgressPercent, overallIdentifiedCount, totalNodes } =
    overview;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] p-4 space-y-3.5">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#181829] tracking-tight">
              Identification Progress
            </span>
            <Badge variant="purple" className="text-[10px] py-0 px-2 font-bold font-mono">
              {overallIdentifiedCount} / {totalNodes} Confirmed ({overallProgressPercent}%)
            </Badge>
          </div>
          <p className="text-[11px] text-[#71758E] mt-0.5">
            Verify AI/rule-based suggestions to establish structural semantic identities
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            pill
            onClick={onOpenRevalidationModal}
            className="text-xs gap-1.5"
            title="Revalidate identifications against current GLB geometry"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Revalidate GLB</span>
          </Button>

          <Button
            variant="purple"
            size="sm"
            pill
            onClick={onOpenBulkModal}
            className="text-xs gap-1.5"
            title="Bulk confirm or edit multiple node identifications"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bulk Identify</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#8B5CF6] to-[#10B981] h-full rounded-full transition-all duration-500"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
      </div>

      {/* 3 Metric Cards: Rooms, Objects, IoT Anchors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Rooms Card */}
        <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#7C3AED] font-bold">
              <Grid2X2 className="w-4 h-4" />
              <span>Rooms</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#181829]">
              {rooms.identified} / {rooms.total}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#71758E]">
            <span>Unidentified: {rooms.unidentified}</span>
            {rooms.needsReview > 0 && (
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> {rooms.needsReview} review
              </span>
            )}
          </div>
        </div>

        {/* Objects Card */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Box className="w-4 h-4 text-[#8B5CF6]" />
              <span>Objects & Devices</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#181829]">
              {objects.identified} / {objects.total}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#71758E]">
            <span>Unidentified: {objects.unidentified}</span>
            {objects.needsReview > 0 && (
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> {objects.needsReview} review
              </span>
            )}
          </div>
        </div>

        {/* Anchors Card */}
        <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>IoT Anchors</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#181829]">
              {anchors.identified} / {anchors.total}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#71758E]">
            <span>Unidentified: {anchors.unidentified}</span>
            {anchors.needsReview > 0 && (
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> {anchors.needsReview} review
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

