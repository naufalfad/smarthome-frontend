import React from 'react';
import {
  Box,
  Target,
  FolderTree,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  Maximize2,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { NodeInfo } from '../../types/house-model';
import { SceneNodeHierarchyMeta } from '../../types/scene-interaction';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface ObjectInspectorProps {
  selectedNode: NodeInfo | null;
  hierarchyMeta: SceneNodeHierarchyMeta | null;
  onSelectNodeByName: (nodeName: string) => void;
  isolatedRoom: string | null;
  onIsolateRoom: (roomName: string) => void;
  onClearIsolation: () => void;
}

export const ObjectInspector: React.FC<ObjectInspectorProps> = ({
  selectedNode,
  hierarchyMeta,
  onSelectNodeByName,
  isolatedRoom,
  onIsolateRoom,
  onClearIsolation,
}) => {
  if (!selectedNode || !hierarchyMeta) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] p-6 flex flex-col items-center justify-center text-center min-h-[350px]">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#8B5CF6] mb-3 shadow-xs">
          <Target className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-[#181829]">
          No 3D Element Selected
        </h3>
        <p className="text-xs text-[#71758E] max-w-xs mt-1 leading-relaxed">
          Click any room, device mesh (AC, lighting), or IoT anchor marker in the 3D Dollhouse, or pick an item from the Scene Explorer.
        </p>
      </div>
    );
  }

  const { node, parentRoom, parentFloor, hierarchyPath, descendantMeshNames, isAnchor, isRoom } = hierarchyMeta;

  // Convert quaternion to Euler degrees for human-readable display
  const rotEuler = [
    Math.round(node.transform.rotation[0] * (180 / Math.PI) * 10) / 10,
    Math.round(node.transform.rotation[1] * (180 / Math.PI) * 10) / 10,
    Math.round(node.transform.rotation[2] * (180 / Math.PI) * 10) / 10,
  ];

  const isCurrentRoomIsolated = parentRoom && isolatedRoom === parentRoom.name;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] p-5 space-y-4">
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider">
            3D Node Inspector
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ID: #{node.index}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 text-[#8B5CF6] border border-purple-100 shrink-0 shadow-xs">
            {isAnchor ? (
              <Target className="w-5 h-5" />
            ) : node.hasMesh ? (
              <Box className="w-5 h-5" />
            ) : (
              <FolderTree className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-[#181829] tracking-tight truncate font-mono">
              {node.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <Badge variant="purple" className="text-[10px] py-0 px-2 font-bold">
                {node.classification}
              </Badge>
              <Badge variant="slate" className="text-[10px] py-0 px-2 font-mono">
                {node.type}
              </Badge>
              {isAnchor && (
                <Badge variant="success" className="text-[10px] py-0 px-2 font-bold">
                  IoT Anchor
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchy Path Breadcrumb Bar */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider block">
          Hierarchy Breadcrumb Path
        </span>
        <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          {hierarchyPath.map((pathItem, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
              <button
                onClick={() => onSelectNodeByName(pathItem)}
                className={`truncate max-w-[110px] px-1 py-0.5 rounded-md hover:bg-white hover:text-[#8B5CF6] transition-colors ${
                  pathItem === node.name ? 'text-[#8B5CF6] font-bold' : 'text-slate-600'
                }`}
                title={`Select ${pathItem}`}
              >
                {pathItem}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Parent Spatial Entities & Room Isolation Quick Action */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Parent Room */}
        <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
          <span className="text-[10px] text-[#71758E] font-medium block">
            Parent Room
          </span>
          {parentRoom ? (
            <button
              onClick={() => onSelectNodeByName(parentRoom.name)}
              className="font-bold text-[#7C3AED] hover:underline font-mono truncate max-w-full block mt-0.5 text-left"
              title={`Select ${parentRoom.name}`}
            >
              {parentRoom.name}
            </button>
          ) : (
            <span className="text-slate-400 font-mono mt-0.5 block">None</span>
          )}
        </div>

        {/* Parent Floor */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-[#71758E] font-medium block">
            Parent Floor
          </span>
          {parentFloor ? (
            <button
              onClick={() => onSelectNodeByName(parentFloor.name)}
              className="font-bold text-[#181829] hover:text-[#8B5CF6] font-mono truncate max-w-full block mt-0.5 text-left"
              title={`Select ${parentFloor.name}`}
            >
              {parentFloor.name}
            </button>
          ) : (
            <span className="text-slate-400 font-mono mt-0.5 block">None</span>
          )}
        </div>
      </div>

      {/* Room Isolation Button if inside a room */}
      {parentRoom && (
        <div>
          {isCurrentRoomIsolated ? (
            <Button
              variant="secondary"
              size="sm"
              pill
              onClick={onClearIsolation}
              className="w-full text-xs gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Show Full Dollhouse (Exit Isolation)</span>
            </Button>
          ) : (
            <Button
              variant="purple"
              size="sm"
              pill
              onClick={() => onIsolateRoom(parentRoom.name)}
              className="w-full text-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Isolate Room ({parentRoom.name})</span>
            </Button>
          )}
        </div>
      )}

      {/* Transformation Properties */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider block">
          Spatial Transformation (Read-Only)
        </span>
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#71758E] block font-sans font-medium">Position (X,Y,Z)</span>
            <span className="text-[#181829] font-bold">
              [{node.transform.position.map((v) => v.toFixed(2)).join(', ')}]
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#71758E] block font-sans font-medium">Rotation (Deg)</span>
            <span className="text-[#181829] font-bold">
              [{rotEuler.join(', ')}°]
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#71758E] block font-sans font-medium">Scale</span>
            <span className="text-[#181829] font-bold">
              [{node.transform.scale.map((v) => v.toFixed(2)).join(', ')}]
            </span>
          </div>
        </div>
      </div>

      {/* Geometry & Mesh Summary */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider block">
          Geometry & Structural Properties
        </span>
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#71758E]">Has 3D Geometry:</span>
            <span className="font-bold text-[#181829]">
              {node.hasMesh ? 'Yes (Mesh Primitive)' : 'No (Spatial Empty)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#71758E]">Descendant Meshes:</span>
            <span className="font-bold font-mono text-[#8B5CF6]">
              {descendantMeshNames.length} mesh node(s)
            </span>
          </div>
          {node.meshIndex !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-[#71758E]">Mesh Index:</span>
              <span className="font-mono text-[#181829]">#{node.meshIndex}</span>
            </div>
          )}
        </div>
      </div>

      {/* IoT Device Mapping Status (Read-Only Placeholder for Phase 4) */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-200/80 text-slate-600">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#181829] block">
              IoT Telemetry Binding
            </span>
            <span className="text-[11px] text-[#71758E]">
              Unmapped · Scheduled for Phase 4
            </span>
          </div>
        </div>
        <Badge variant="slate" className="font-bold text-[10px]">
          UNMAPPED
        </Badge>
      </div>
    </div>
  );
};

