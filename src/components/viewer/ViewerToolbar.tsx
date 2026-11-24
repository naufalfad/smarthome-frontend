import React from 'react';
import {
  RotateCcw,
  Compass,
  Layers,
  Target,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  X,
  Sparkles,
} from 'lucide-react';
import { CameraPreset } from '../../types/scene-interaction';
import { Badge } from '../ui/badge';

export interface ViewerToolbarProps {
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  floorNames: string[];
  activeFloor: string | null;
  onSelectFloor: (floorName: string | null) => void;
  isolatedRoom: string | null;
  onClearIsolation: () => void;
  showAnchors: boolean;
  onToggleAnchors: () => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  cameraPreset,
  onSelectCameraPreset,
  floorNames,
  activeFloor,
  onSelectFloor,
  isolatedRoom,
  onClearIsolation,
  showAnchors,
  onToggleAnchors,
  wireframe,
  onToggleWireframe,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <>
      {/* Top Floating Controls Bar: Camera Presets & Floor Level Selector */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2 max-w-full">
        {/* Floor Level Filter (if multiple floors available) */}
        {floorNames.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
            <span className="text-[10px] font-bold text-[#71758E] pl-2.5 pr-1 uppercase tracking-wider">
              Floor:
            </span>
            <button
              onClick={() => onSelectFloor(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeFloor === null
                  ? 'bg-[#181824] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {floorNames.map((floor) => (
              <button
                key={floor}
                onClick={() => onSelectFloor(floor)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  activeFloor === floor
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {floor.replace(/^FLOOR[_-]/i, 'F')}
              </button>
            ))}
          </div>
        )}

        {/* Camera Perspective Presets */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
          <button
            onClick={() => onSelectCameraPreset('ISO')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
              cameraPreset === 'ISO'
                ? 'bg-[#181824] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Isometric Dollhouse Cutaway Perspective"
          >
            Isometric
          </button>
          <button
            onClick={() => onSelectCameraPreset('TOP')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
              cameraPreset === 'TOP'
                ? 'bg-[#181824] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Top-Down Floorplan Perspective"
          >
            Top View
          </button>
          <button
            onClick={() => onSelectCameraPreset('FRONT')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
              cameraPreset === 'FRONT'
                ? 'bg-[#181824] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Front Elevation Perspective"
          >
            Front
          </button>
          <button
            onClick={() => onSelectCameraPreset('RESET')}
            className="p-1.5 rounded-full text-slate-500 hover:text-[#8B5CF6] hover:bg-purple-50 transition-colors"
            title="Reset Camera Target and Framing"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: Isolation Badge + Anchor Toggle + Wireframe + Fullscreen */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg">
        {/* Isolated Room Pill Indicator (if any room is isolated) */}
        {isolatedRoom && (
          <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-bold shadow-xs animate-in fade-in">
            <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
            <span className="truncate max-w-[140px]">Isolated: {isolatedRoom}</span>
            <button
              onClick={onClearIsolation}
              className="p-0.5 rounded-full hover:bg-purple-200 text-[#7C3AED] transition-colors"
              title="Clear Room Isolation (Show entire house)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-purple-200 mx-0.5" />
          </div>
        )}

        {/* Toggle IoT Anchors */}
        <button
          onClick={onToggleAnchors}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            showAnchors
              ? 'bg-purple-50 text-[#7C3AED] border border-purple-200/80'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={showAnchors ? 'Hide IoT Anchors' : 'Show IoT Anchors'}
        >
          <Target className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Anchors</span>
          {showAnchors ? (
            <Eye className="w-3 h-3 opacity-60" />
          ) : (
            <EyeOff className="w-3 h-3 opacity-60" />
          )}
        </button>

        <div className="w-px h-4 bg-slate-200" />

        {/* Toggle Wireframe */}
        <button
          onClick={onToggleWireframe}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            wireframe
              ? 'bg-purple-100 text-[#7C3AED]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle Wireframe Visualization"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Wireframe</span>
        </button>

        <div className="w-px h-4 bg-slate-200" />

        {/* Toggle Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-full text-slate-600 hover:text-[#8B5CF6] hover:bg-purple-50 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </>
  );
};

