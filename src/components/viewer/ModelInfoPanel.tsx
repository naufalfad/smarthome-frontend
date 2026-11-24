import React, { useState } from 'react';
import {
  Info,
  Calendar,
  HardDrive,
  Maximize2,
  Box,
  Layers,
  Palette,
  RotateCw,
  Sparkles,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';
import { HouseModel } from '../../types/house-model';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatBytes } from '../../lib/utils';
import { houseModelApi } from '../../services/house-model.api';

export interface ModelInfoPanelProps {
  model: HouseModel;
  onModelUpdated: (updated: HouseModel) => void;
}

export const ModelInfoPanel: React.FC<ModelInfoPanelProps> = ({
  model,
  onModelUpdated,
}) => {
  const [isReinspecting, setIsReinspecting] = useState(false);
  const [reinspectMsg, setReinspectMsg] = useState<string | null>(null);

  const meta = model.modelMetadata;

  const handleReinspect = async () => {
    setIsReinspecting(true);
    setReinspectMsg(null);
    try {
      const res = await houseModelApi.reinspectHouseModel(model.id);
      onModelUpdated(res.model);
      setReinspectMsg('Model re-inspected and metadata updated successfully!');
      setTimeout(() => setReinspectMsg(null), 3500);
    } catch (err: any) {
      setReinspectMsg(`Re-inspection failed: ${err?.message || err}`);
    } finally {
      setIsReinspecting(false);
    }
  };

  const uploadDateFormatted = new Date(model.createdAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#181829]">
              {model.name}
            </h3>
            <Badge
              variant={
                model.status === 'PUBLISHED'
                  ? 'success'
                  : model.status === 'DRAFT'
                  ? 'purple'
                  : 'slate'
              }
              className="text-[10px]"
            >
              {model.status}
            </Badge>
          </div>
          {model.description && (
            <p className="text-xs text-[#71758E] mt-1 leading-relaxed">
              {model.description}
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          pill
          onClick={handleReinspect}
          disabled={isReinspecting}
          className="shrink-0 text-xs"
          title="Re-run GLB node graph inspection"
        >
          <RotateCw
            className={`w-3.5 h-3.5 text-[#8B5CF6] ${
              isReinspecting ? 'animate-spin' : ''
            }`}
          />
          <span className="hidden sm:inline">Re-inspect</span>
        </Button>
      </div>

      {reinspectMsg && (
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{reinspectMsg}</span>
        </div>
      )}

      {/* Primary KPI Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-[#71758E] font-medium block">
            Total Nodes
          </span>
          <span className="text-lg font-extrabold text-[#181829] font-mono">
            {meta?.summary.totalNodes ?? 0}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-[#71758E] font-medium block">
            Total Meshes
          </span>
          <span className="text-lg font-extrabold text-[#181829] font-mono">
            {meta?.summary.totalMeshes ?? 0}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-[#71758E] font-medium block">
            Materials
          </span>
          <span className="text-lg font-extrabold text-[#181829] font-mono">
            {meta?.summary.totalMaterials ?? 0}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-[#71758E] font-medium block">
            IoT Anchors
          </span>
          <span className="text-lg font-extrabold text-[#8B5CF6] font-mono">
            {meta?.summary.totalEmptyAnchors ?? 0}
          </span>
        </div>
      </div>

      {/* Asset Specifications List */}
      <div className="space-y-2.5 text-xs">
        <h4 className="text-[11px] font-bold text-[#71758E] uppercase tracking-wider">
          Asset File Specifications
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span className="text-[#71758E]">Original File:</span>
            <span className="font-mono text-[#181829] font-semibold truncate">
              {model.fileName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span className="text-[#71758E]">File Size:</span>
            <span className="font-mono text-[#181829] font-semibold">
              {formatBytes(model.fileSize)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span className="text-[#71758E]">Uploaded At:</span>
            <span className="font-medium text-[#181829]">
              {uploadDateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[#71758E]">Container:</span>
            <span className="font-medium text-[#181829]">
              Binary glTF 2.0 (GLB)
            </span>
          </div>
        </div>
      </div>

      {/* Physical Dimensions & Bounding Box */}
      {meta && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#71758E] uppercase tracking-wider">
              Calculated Bounding Box
            </h4>
            <span className="text-[10px] text-slate-400">
              {meta.dimensions.unitHint}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 text-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#71758E] font-sans">Model Dimensions:</span>
              <span className="font-bold text-[#181829]">
                {meta.dimensions.x}m (W) × {meta.dimensions.y}m (H) × {meta.dimensions.z}m (D)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#71758E] font-sans">Min Bounds:</span>
              <span>[{meta.boundingBox.min.join(', ')}]</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#71758E] font-sans">Max Bounds:</span>
              <span>[{meta.boundingBox.max.join(', ')}]</span>
            </div>
          </div>
          <p className="text-[10px] text-[#71758E] leading-relaxed">
            * Note: Dimensions reflect raw geometry vertex extents from the GLB container.
          </p>
        </div>
      )}

      {/* Heuristic Classified Node Categories */}
      {meta && (
        <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
          <h4 className="text-[11px] font-bold text-[#71758E] uppercase tracking-wider">
            Detected Architectural Hierarchy
          </h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="success" className="text-[11px]">
              {meta.summary.totalRoomsDetected} Room Zones
            </Badge>
            <Badge variant="slate" className="text-[11px]">
              {meta.summary.totalFloorsDetected} Floor Levels
            </Badge>
            <Badge variant="purple" className="text-[11px]">
              {meta.summary.totalDevicesDetected} Visual Devices
            </Badge>
            <Badge variant="purple" className="text-[11px]">
              {meta.summary.totalEmptyAnchors} IoT Anchors
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

